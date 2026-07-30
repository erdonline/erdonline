package com.erdonline.erd.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.erdonline.common.bean.system.dto.BaseTreeNode;
import com.erdonline.common.bean.util.TreeUtil;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.dto.DataDictTreeNode;
import com.erdonline.erd.dto.QueryInfoTreeNode;
import com.erdonline.erd.entity.DataDict;
import com.erdonline.erd.entity.QueryInfo;
import com.erdonline.erd.mapper.DataDictMapper;
import com.erdonline.erd.service.DataDictService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 数据字典表  服务实现
 *
 * @author 零代科技
 * @version 1.0
 * @date 2024-10-05
 * @describtion
 * @since 1.0
 */
@Service
public class DataDictServiceImpl extends MartinServiceImpl<DataDictMapper, DataDict> implements DataDictService {
    @Override
    protected void setEntity() {
        this.clz = DataDict.class;
    }

    @Override
    public List<BaseTreeNode> tree(DataDict entity) {
        MartinUser accessUser = SecurityContextUtil.getAccessUser();
        entity.setCreator(accessUser.getUsername());

        // 创建查询条件，使用OR条件包含system用户的记录
        QueryWrapper<DataDict> wrapper = Wrappers.<DataDict>query()
                .and(w -> w.eq("creator", accessUser.getUsername())
                        .or()
                        .eq("creator", "system"));

        List<DataDict> allRecords;

        // 如果有搜索关键词
        if (entity.getTitle() != null && !entity.getTitle().trim().isEmpty()) {
            String keyword = entity.getTitle().trim();

            // 先查找匹配的节点
            wrapper.and(w -> w.like("title", keyword)
                    .or()
                    .like("dict_code", keyword));

            List<DataDict> matchedRecords = this.list(wrapper);

            if (!matchedRecords.isEmpty()) {
                Set<String> relatedIds = new HashSet<>();

                for (DataDict record : matchedRecords) {
                    // 收集父节点ID
                    String parentId = record.getParentId();
                    while (parentId != null && !parentId.equals("0")) {
                        relatedIds.add(parentId);
                        DataDict parent = this.getById(parentId);
                        if (parent != null) {
                            parentId = parent.getParentId();
                        } else {
                            break;
                        }
                    }

                    // 收集子节点ID
                    collectChildrenIds(record.getId(), relatedIds);
                }

                // 如果有相关节点，重新查询包含所有相关节点的完整记录
                if (!relatedIds.isEmpty()) {
                    wrapper = Wrappers.<DataDict>query()
                            .and(w -> w.eq("creator", accessUser.getUsername())
                                    .or()
                                    .eq("creator", "system"))
                            .and(w -> w.like("title", keyword)
                                    .or()
                                    .like("dict_code", keyword)
                                    .or()
                                    .in("id", relatedIds));
                }
            }
        }

        // 按创建时间排序，确保system的记录在前面
        wrapper.orderByAsc("CASE WHEN creator = 'system' THEN 0 ELSE 1 END")
                .orderByDesc("create_time");

        allRecords = this.list(wrapper);

        List<BaseTreeNode> baseTreeNodeList = allRecords.stream()
                .map(m -> {
                    BaseTreeNode baseTreeNode = new DataDictTreeNode();
                    BeanUtils.copyProperties(m, baseTreeNode);
                    return baseTreeNode;
                })
                .collect(Collectors.toList());
        return TreeUtil.buildTreeByRecursive(baseTreeNodeList, "0");
    }

    /**
     * 递归收集所有子节点ID
     */
    private void collectChildrenIds(String parentId, Set<String> childrenIds) {
        QueryWrapper<DataDict> childWrapper = Wrappers.<DataDict>query()
                .eq("parent_id", parentId);

        List<DataDict> children = this.list(childWrapper);
        if (!children.isEmpty()) {
            for (DataDict child : children) {
                childrenIds.add(child.getId());
                // 递归收集更深层的子节点
                collectChildrenIds(child.getId(), childrenIds);
            }
        }
    }
}
