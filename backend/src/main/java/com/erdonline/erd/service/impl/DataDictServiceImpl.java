package com.erdonline.erd.service.impl;

import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.erdonline.common.bean.system.dto.BaseTreeNode;
import com.erdonline.common.bean.util.TreeUtil;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.dto.DataDictApplyResult;
import com.erdonline.erd.dto.DataDictFieldDto;
import com.erdonline.erd.dto.DataDictInfoDto;
import com.erdonline.erd.dto.DataDictTreeNode;
import com.erdonline.erd.entity.DataDict;
import com.erdonline.erd.mapper.DataDictMapper;
import com.erdonline.erd.security.DataDictAcl;
import com.erdonline.erd.security.DataDictScope;
import com.erdonline.erd.security.ProjectAcl;
import com.erdonline.erd.service.DataDictService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 字段库服务实现（ADR-0032 scope ACL + copy-on-apply）。
 */
@Service
@RequiredArgsConstructor
public class DataDictServiceImpl extends MartinServiceImpl<DataDictMapper, DataDict> implements DataDictService {

    private final DataDictAcl dataDictAcl;
    private final ProjectAcl projectAcl;

    @Override
    protected void setEntity() {
        this.clz = DataDict.class;
    }

    @Override
    public List<BaseTreeNode> tree(DataDict entity, String projectId) {
        MartinUser accessUser = SecurityContextUtil.getAccessUser();
        String userId = accessUser.getId();
        String username = accessUser.getUsername();

        QueryWrapper<DataDict> wrapper = buildVisibleScopeWrapper(userId, username, projectId);

        if (entity != null && StrUtil.isNotBlank(entity.getTitle())) {
            String keyword = entity.getTitle().trim();
            wrapper.and(w -> w.like("title", keyword).or().like("dict_code", keyword));
            List<DataDict> matched = this.list(wrapper);
            if (!matched.isEmpty()) {
                Set<String> relatedIds = new HashSet<>();
                for (DataDict record : matched) {
                    if (!dataDictAcl.canRead(record, userId, username)) {
                        continue;
                    }
                    collectAncestorIds(record, relatedIds);
                    collectChildrenIds(record.getId(), relatedIds);
                }
                wrapper = buildVisibleScopeWrapper(userId, username, projectId);
                wrapper.and(w -> w.like("title", keyword)
                        .or()
                        .like("dict_code", keyword)
                        .or()
                        .in(!relatedIds.isEmpty(), "id", relatedIds));
            }
        }

        wrapper.orderByAsc("CASE WHEN scope_type = 'platform' THEN 0 WHEN scope_type = 'group' THEN 1 ELSE 2 END")
                .orderByDesc("create_time");

        List<DataDict> allRecords = this.list(wrapper).stream()
                .filter(r -> dataDictAcl.canRead(r, userId, username))
                .collect(Collectors.toList());

        List<BaseTreeNode> baseTreeNodeList = allRecords.stream()
                .map(m -> toTreeNode(m, userId, username))
                .collect(Collectors.toList());
        return TreeUtil.buildTreeByRecursive(baseTreeNodeList, "0");
    }

    @Override
    public DataDictApplyResult apply(String id) {
        DataDict record = requireReadable(id);
        if (!Boolean.TRUE.equals(record.getIsLeaf())) {
            throw new ValidateException("仅叶子节点可应用到表");
        }
        DataDictInfoDto info = record.getDictInfo();
        if (info == null || info.getFields() == null || info.getFields().isEmpty()) {
            throw new ValidateException("该条目无字段定义");
        }

        DataDictApplyResult result = new DataDictApplyResult();
        result.setDictId(record.getId());
        result.setDictCode(record.getDictCode());
        result.setTitle(record.getTitle());

        List<DataDictFieldDto> fields = new ArrayList<>();
        for (DataDictFieldDto src : info.getFields()) {
            DataDictFieldDto copy = new DataDictFieldDto();
            BeanUtils.copyProperties(src, copy);
            copy.setDictRef(record.getId());
            fields.add(copy);
        }
        result.setFields(fields);
        if (info.getEnums() != null) {
            result.setEnums(new ArrayList<>(info.getEnums()));
        }

        record.setUsageCount((record.getUsageCount() == null ? 0 : record.getUsageCount()) + 1);
        this.updateById(record);
        return result;
    }

    @Override
    public boolean createDict(DataDict dataDict) {
        MartinUser accessUser = SecurityContextUtil.getAccessUser();
        dataDictAcl.assertCreatable(dataDict, accessUser.getId(), accessUser.getUsername());
        if (StrUtil.isBlank(dataDict.getId())) {
            dataDict.setId(IdUtil.fastSimpleUUID());
        }
        if (StrUtil.isBlank(dataDict.getParentId())) {
            dataDict.setParentId("0");
        }
        if (dataDict.getIsLeaf() == null) {
            dataDict.setIsLeaf(Boolean.FALSE);
        }
        if (dataDict.getUsageCount() == null) {
            dataDict.setUsageCount(0);
        }
        if (StrUtil.isBlank(dataDict.getScopeType())) {
            dataDict.setScopeType(DataDictScope.USER);
        }
        return this.save(dataDict);
    }

    @Override
    public boolean updateDict(String id, DataDict dataDict) {
        DataDict existing = requireWritable(id);
        dataDict.setId(existing.getId());
        dataDict.setScopeType(existing.getScopeType());
        dataDict.setScopeId(existing.getScopeId());
        dataDict.setCreator(existing.getCreator());
        return this.updateById(dataDict);
    }

    @Override
    public boolean deleteDict(String id) {
        requireWritable(id);
        return this.removeById(id);
    }

    private DataDict requireReadable(String id) {
        DataDict record = this.getById(id);
        if (record == null) {
            throw new ValidateException(ApiErrorCode.NOT_FOUND);
        }
        MartinUser accessUser = SecurityContextUtil.getAccessUser();
        dataDictAcl.assertReadable(record, accessUser.getId(), accessUser.getUsername());
        return record;
    }

    private DataDict requireWritable(String id) {
        DataDict record = this.getById(id);
        if (record == null) {
            throw new ValidateException(ApiErrorCode.NOT_FOUND);
        }
        MartinUser accessUser = SecurityContextUtil.getAccessUser();
        dataDictAcl.assertWritable(record, accessUser.getId(), accessUser.getUsername());
        return record;
    }

    private QueryWrapper<DataDict> buildVisibleScopeWrapper(String userId, String username, String projectId) {
        QueryWrapper<DataDict> wrapper = Wrappers.query();
        wrapper.and(w -> {
            w.eq("scope_type", DataDictScope.PLATFORM)
                    .or()
                    .nested(n -> n.eq("scope_type", DataDictScope.USER)
                            .and(u -> u.eq("scope_id", userId).or().eq("creator", username)))
                    .or()
                    .nested(n -> {
                        n.eq("scope_type", DataDictScope.GROUP);
                        if (StrUtil.isNotBlank(projectId) && projectAcl.isMember(projectId, userId)) {
                            n.eq("scope_id", projectId);
                        } else {
                            n.apply("1=0");
                        }
                    });
        });
        return wrapper;
    }

    private DataDictTreeNode toTreeNode(DataDict m, String userId, String username) {
        DataDictTreeNode node = new DataDictTreeNode();
        BeanUtils.copyProperties(m, node);
        node.setReadOnly(!dataDictAcl.canWrite(m, userId, username));
        return node;
    }

    private void collectAncestorIds(DataDict record, Set<String> relatedIds) {
        String parentId = record.getParentId();
        while (parentId != null && !"0".equals(parentId)) {
            relatedIds.add(parentId);
            DataDict parent = this.getById(parentId);
            if (parent == null) {
                break;
            }
            parentId = parent.getParentId();
        }
    }

    private void collectChildrenIds(String parentId, Set<String> childrenIds) {
        QueryWrapper<DataDict> childWrapper = Wrappers.<DataDict>query().eq("parent_id", parentId);
        List<DataDict> children = this.list(childWrapper);
        for (DataDict child : children) {
            childrenIds.add(child.getId());
            collectChildrenIds(child.getId(), childrenIds);
        }
    }
}
