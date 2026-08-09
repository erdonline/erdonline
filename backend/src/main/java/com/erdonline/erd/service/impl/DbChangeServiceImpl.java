package com.erdonline.erd.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import com.erdonline.erd.entity.DbChange;
import com.erdonline.erd.entity.DbVersion;
import com.erdonline.erd.mapper.DbChangeMapper;
import com.erdonline.erd.security.VersionDbKeyGuard;
import com.erdonline.erd.service.DbChangeService;
import com.erdonline.erd.service.DbVersionService;
import com.erdonline.erd.util.VersionDiffEngine;
import com.erdonline.erd.util.VersionPanelDiffEngine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
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

    @Autowired
    private VersionDbKeyGuard dbKeyGuard;

    // 权限校验（成员 + db_key 归属）统一收敛在 Controller 方法上的 @RequireProjectAccess
    // + ProjectAccessAspect（见 com.erdonline.erd.security.aspect），本类只做业务逻辑与
    // db_key 别名归一化，不重复散落断言。经由 GenDocServiceImpl 等其它入口调用时，
    // 由那些入口自行 assertMember（同样复用 VersionDbKeyGuard/ProjectAcl，非另起炉灶）。

    @Override
    public IPage<DbChange> getPage(Map params) throws IllegalAccessException, InstantiationException {
        normalizeDbKeyParam(params);
        return super.getPage(params);
    }

    @Override
    public R loadHistory(Map map) {
        String projectId = mapStr(map, "projectId");
        String dbKey = dbKeyGuard.resolveDbKey(projectId, mapStr(map, "dbKey"));

        QueryWrapper<DbChange> wrapper = new QueryWrapper<>();
        wrapper.eq("project_id", projectId);
        wrapper.eq("db_key", dbKey);
        wrapper.orderBy(false, false, "version");
        List<DbChange> dbChanges = this.list(wrapper);
        return getHashMapsByDbChanges(dbChanges);
    }

    @Override
    public List<DbChange> loadHistoryVersion(String projectId, String dbKey) {
        String canonicalDbKey = dbKeyGuard.resolveDbKey(projectId, dbKey);
        QueryWrapper<DbChange> wrapper = new QueryWrapper<>();
        wrapper.eq("project_id", projectId);
        wrapper.eq("db_key", canonicalDbKey);
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
            // changeId 本身不携带调用者信息：先取出行归属的 projectId 再断言成员，
            // 否则任意登录用户猜/枚举 changeId 即可跨租户删除他人版本（IDOR）。
            dbKeyGuard.assertDbKeyBelongsToCaller(dbChange.getProjectId(), dbChange.getDbKey());
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
        if (StrUtil.isNotBlank(dbChange.getProjectId()) && StrUtil.isNotBlank(dbChange.getDbKey())) {
            dbChange.setDbKey(dbKeyGuard.resolveDbKey(dbChange.getProjectId(), dbChange.getDbKey()));
        }
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
        if (StrUtil.isNotBlank(dbChange.getProjectId()) && StrUtil.isNotBlank(dbChange.getDbKey())) {
            dbChange.setDbKey(dbKeyGuard.resolveDbKey(dbChange.getProjectId(), dbChange.getDbKey()));
        }
        if (dbChange.getTag() != null && dbChange.getTag().length() > 255) {
            return R.failed("版本标签总长度不能超过 255 个字符");
        }
        // 「所见即真差异」：changes 落库前后端重算，不信任前端算的旧值（校验/存储用同一份权威算法）。
        // 统一规则：不管 baseVersion 标记，changes 恒等于「相对当前库里最新一条」的 diff；
        // 没有已存版本（首次存版 / 重建基线刚清空历史）时基线视为空模型，diff 即全量 add——
        // 不再对 baseVersion=true 特殊清空，否则首版会出现「模型有表，变更摘要却是空」的错位
        // （模型变更 UI 与实际 changes 数据不一致，用户看到的又是一次假差异）。
        if (StrUtil.isBlank(dbChange.getId())) {
            DbChange latest = findLatestVersion(dbChange.getProjectId(), dbChange.getDbKey());
            Map<String, Object> baseline = latest != null && latest.getProjectJSON() != null
                    ? latest.getProjectJSON() : Collections.emptyMap();
            List<Map<String, Object>> computed = VersionDiffEngine.diff(dbChange.getProjectJSON(), baseline);
            dbChange.setChanges(new ArrayList<>(computed));
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

    @Override
    public R diffAgainstLatest(Map<String, Object> body) {
        if (body == null) {
            return R.failed("请求体不能为空");
        }
        String projectId = (String) body.get("projectId");
        String rawDbKey = (String) body.get("dbKey");
        Object projectJSONRaw = body.get("projectJSON");
        if (StrUtil.isBlank(projectId) || StrUtil.isBlank(rawDbKey) || !(projectJSONRaw instanceof Map)) {
            return R.failed("projectId / dbKey / projectJSON 均为必填");
        }
        String dbKey = dbKeyGuard.resolveDbKey(projectId, rawDbKey);
        @SuppressWarnings("unchecked")
        Map<String, Object> projectJSON = (Map<String, Object>) projectJSONRaw;

        Object explicitBaselineRaw = body.get("baselineProjectJSON");
        String dialectCode = body.get("dialectCode") != null
                ? String.valueOf(body.get("dialectCode"))
                : "MYSQL";
        Map<String, Object> result = new HashMap<>();
        if (explicitBaselineRaw instanceof Map) {
            // 显式基线（如历史版本两两比对）：直接 diff，不查库。
            @SuppressWarnings("unchecked")
            Map<String, Object> explicitBaseline = (Map<String, Object>) explicitBaselineRaw;
            Map<String, Object> panel = VersionPanelDiffEngine.compute(projectJSON, explicitBaseline, dialectCode);
            result.put("hasBaseline", true);
            result.put("baseline", null);
            result.put("changes", panel.get("changes"));
            result.put("ddl", panel.get("ddl"));
            return R.ok(result);
        }

        DbChange latest = findLatestVersion(projectId, dbKey);
        boolean hasBaseline = latest != null;
        Map<String, Object> baselineProjectJSON = hasBaseline && latest.getProjectJSON() != null
                ? latest.getProjectJSON() : Collections.emptyMap();

        Map<String, Object> panel = VersionPanelDiffEngine.compute(projectJSON, baselineProjectJSON, dialectCode);
        result.put("hasBaseline", hasBaseline);
        result.put("baseline", hasBaseline ? baselineMeta(latest) : null);
        result.put("changes", panel.get("changes"));
        result.put("ddl", panel.get("ddl"));
        return R.ok(result);
    }

    private static Map<String, Object> baselineMeta(DbChange latest) {
        Map<String, Object> meta = new HashMap<>();
        meta.put("id", latest.getId());
        meta.put("version", latest.getVersion());
        meta.put("versionDate", latest.getVersionDate());
        meta.put("createTime", latest.getCreateTime());
        return meta;
    }

    private void normalizeDbKeyParam(Map params) {
        if (params == null) {
            return;
        }
        String projectId = mapStr(params, "projectId");
        String dbKey = mapStr(params, "dbKey");
        if (projectId != null && dbKey != null) {
            params.put("dbKey", dbKeyGuard.resolveDbKey(projectId, dbKey));
        }
    }

    @SuppressWarnings("unchecked")
    private static String mapStr(Map map, String key) {
        Object v = map == null ? null : map.get(key);
        return v == null ? null : String.valueOf(v);
    }

    /** 独立查询最新版本作为 A 层基线：createTime desc 为主序，version desc 兜底旧数据（ADR-0022）。
     *  调用方须已完成成员与 dbKey 归属校验，此处仅做幂等的别名归一化，不重复鉴权。 */
    private DbChange findLatestVersion(String projectId, String dbKey) {
        QueryWrapper<DbChange> wrapper = new QueryWrapper<>();
        wrapper.eq("project_id", projectId);
        wrapper.eq("db_key", dbKeyGuard.resolveDbKey(projectId, dbKey));
        wrapper.orderByDesc("create_time");
        wrapper.orderByDesc("version");
        List<DbChange> list = this.list(wrapper);
        return list.isEmpty() ? null : list.get(0);
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
