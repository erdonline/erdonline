package com.erdonline.erd.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import com.erdonline.erd.entity.DbChange;
import com.erdonline.erd.entity.DbVersion;
import com.erdonline.erd.mapper.DbChangeMapper;
import com.erdonline.erd.service.DbChangeService;
import com.erdonline.erd.service.DbVersionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
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
        // 与 deleteHistory 保持一致：清掉该 project+dbKey 下全部推送书签，
        // 否则重建基线后旧书签残留，「已推送/未推送」标签会拿旧版本号比较新基线，误判。
        QueryWrapper<DbVersion> versionWrapper = new QueryWrapper<>();
        versionWrapper.eq("project_id", dbChange.getProjectId());
        versionWrapper.eq("db_key", dbChange.getDbKey());
        dbVersionService.remove(versionWrapper);
        return R.ok(delete);
    }

    @Override
    public R saveVersion(DbChange dbChange) {
        normalizeTag(dbChange);
        if (dbChange.getTag() != null && dbChange.getTag().length() > 255) {
            return R.failed("版本标签总长度不能超过 255 个字符");
        }
        try {
            if (StrUtil.isBlank(dbChange.getId())) {
                this.save(dbChange);
            } else {
                this.updateById(dbChange);
            }
        } catch (DuplicateKeyException e) {
            if (isVersionDuplicateKey(e)) {
                log.warn("db_change version duplicate projectId={} dbKey={} version={}",
                        dbChange.getProjectId(), dbChange.getDbKey(), dbChange.getVersion());
                return R.failed(ApiErrorCode.VERSION_SAVE_DUPLICATE.getCode(),
                        ApiErrorCode.VERSION_SAVE_DUPLICATE.getMsg());
            }
            throw e;
        }
        return R.ok("保存成功");
    }

    /** 识别 db_change (project_id, db_key, version) 唯一索引冲突。 */
    static boolean isVersionDuplicateKey(DuplicateKeyException e) {
        if (e == null) {
            return false;
        }
        String message = e.getMessage();
        if (message == null) {
            return false;
        }
        return message.contains("uk_db_change_project_dbkey_version")
                || message.contains("uni_versin_projectid_dbkey");
    }

    /**
     * 规范化逗号/分号分隔标签：trim、去空、按忽略大小写去重，空则 null。
     */
    static void normalizeTag(DbChange dbChange) {
        if (dbChange == null) {
            return;
        }
        String tag = dbChange.getTag();
        if (tag == null || tag.trim().isEmpty()) {
            dbChange.setTag(null);
            return;
        }
        LinkedHashSet<String> seen = new LinkedHashSet<>();
        List<String> parts = new ArrayList<>();
        for (String raw : tag.split("[,;]")) {
            String t = raw == null ? "" : raw.trim();
            if (t.isEmpty()) {
                continue;
            }
            String key = t.toLowerCase(Locale.ROOT);
            if (seen.add(key)) {
                parts.add(t);
            }
        }
        dbChange.setTag(parts.isEmpty() ? null : String.join(",", parts));
    }

    @Override
    protected void setEntity() {
        this.clz = DbChange.class;

    }
}
