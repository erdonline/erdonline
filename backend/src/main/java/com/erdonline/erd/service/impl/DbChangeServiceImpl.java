package com.erdonline.erd.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.erdonline.common.core.api.R;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import com.erdonline.erd.entity.DbChange;
import com.erdonline.erd.entity.DbVersion;
import com.erdonline.erd.mapper.DbChangeMapper;
import com.erdonline.erd.service.DbChangeService;
import com.erdonline.erd.service.DbVersionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * <p>
 * 版本表 服务实现类
 * </p>
 *
 * @author 狮少
 * @since 2020-10-28
 */
@Slf4j
@Service
public class DbChangeServiceImpl extends MartinServiceImpl<DbChangeMapper, DbChange> implements DbChangeService {
    @Autowired
    private DbVersionService dbVersionService;

    @Override
    public R loadHistory(Map map) {

        QueryWrapper<DbChange> wrapper = new QueryWrapper<>();
        wrapper.eq("project_id", map.get("projectId"));
        wrapper.eq("db_key", map.get("dbKey"));
        wrapper.orderBy(false, false, "version");
        List<DbChange> dbChanges = this.list(wrapper);
        return getHashMapsByDbChanges(dbChanges);
    }

    @Override
    public List<DbChange> loadHistoryVersion(String projectId, String dbKey) {
        QueryWrapper<DbChange> wrapper = new QueryWrapper<>();
        wrapper.eq("project_id", projectId);
        wrapper.eq("db_key", dbKey);
        wrapper.select("version", "version_desc", "version_date", "base_version");
        List<DbChange> dbChanges = this.list(wrapper);
        return dbChanges;
    }

    @Override
    public R getHashMapsByDbChanges(List<DbChange> dbChanges) {
        List<HashMap<Object, Object>> collect = dbChanges.stream().map(dv1 -> {
            HashMap<Object, Object> hashMap = new HashMap<>();
            try {
                BeanUtil.copyProperties(dv1, hashMap, "changes", "projectJSON");
                hashMap.put("changes", dv1.getChanges());
                hashMap.put("projectJSON",dv1.getProjectJSON());
            } catch (Exception e) {
                log.error("", e);
            }
            return hashMap;
        }).collect(Collectors.toList());
        return R.ok(collect);
    }

    @Override
    public R deleteHistory(String changeId) {
        DbChange dbChange = this.getById(changeId);
        if (dbChange != null) {
            QueryWrapper<DbVersion> wrapper = new QueryWrapper<>();
            wrapper.eq("project_id", dbChange.getProjectId());
            wrapper.eq("db_key", dbChange.getDbKey());
            wrapper.eq("db_version", dbChange.getVersion());
            dbVersionService.remove(wrapper);
            return R.ok(this.removeById(changeId));
        } else {
            return R.failed("删除失败，无效的版本");
        }
    }

    @Override
    public R deleteAllHistory(DbChange dbChange) {
        log.info("dbChange: {}", dbChange);
        LambdaUpdateWrapper<DbChange> wrapper = new LambdaUpdateWrapper();
        wrapper.eq(DbChange::getProjectId, dbChange.getProjectId());
        wrapper.eq(DbChange::getDbKey, dbChange.getDbKey());
        int delete = this.baseMapper.delete(wrapper);
        return R.ok(delete);
    }

    @Override
    public R saveVersion(DbChange dbChange) {
        normalizeTag(dbChange);
        if (StrUtil.isNotBlank(dbChange.getTag())
                && isTagTaken(dbChange.getProjectId(), dbChange.getTag(), dbChange.getId())) {
            return R.failed("该版本标签已经存在了");
        }
        if (StrUtil.isBlank(dbChange.getId())) {
            this.save(dbChange);
        } else {
            this.updateById(dbChange);
        }
        return R.ok("保存成功");
    }

    @Override
    public boolean isTagTaken(String projectId, String tag, String excludeId) {
        if (StrUtil.isBlank(projectId) || StrUtil.isBlank(tag)) {
            return false;
        }
        LambdaQueryWrapper<DbChange> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DbChange::getProjectId, projectId);
        wrapper.eq(DbChange::getTag, tag.trim());
        if (StrUtil.isNotBlank(excludeId)) {
            wrapper.ne(DbChange::getId, excludeId);
        }
        return this.count(wrapper) > 0;
    }

    private static void normalizeTag(DbChange dbChange) {
        if (dbChange == null) {
            return;
        }
        String tag = dbChange.getTag();
        if (tag == null || tag.trim().isEmpty()) {
            dbChange.setTag(null);
        } else {
            dbChange.setTag(tag.trim());
        }
    }

    @Override
    protected void setEntity() {
        this.clz = DbChange.class;

    }
}
