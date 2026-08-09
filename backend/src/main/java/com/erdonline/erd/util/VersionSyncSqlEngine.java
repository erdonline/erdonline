package com.erdonline.erd.util;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 版本同步 SQL：全量 / 增量 + upgradeType 变更过滤（与前端 readDb 对齐）。
 */
public final class VersionSyncSqlEngine {

    public static final String MODE_FULL = "full";
    public static final String MODE_INCREMENTAL = "incremental";

    public static final String UPGRADE_INCREMENT = "increment";
    public static final String UPGRADE_REBUILD = "rebuild";

    private VersionSyncSqlEngine() {
    }

    public static String generate(
            Map<String, Object> projectJson,
            Map<String, Object> baselineProjectJson,
            List<Map<String, Object>> changes,
            String dialectCode,
            String mode,
            String upgradeType) {
        if (MODE_FULL.equalsIgnoreCase(mode)) {
            return Json2CodeFullDdlEngine.generateAllSql(projectJson, dialectCode);
        }
        List<Map<String, Object>> effectiveChanges = changes != null ? changes : List.of();
        if (effectiveChanges.isEmpty() && projectJson != null && baselineProjectJson != null) {
            effectiveChanges = VersionDiffEngine.diff(projectJson, baselineProjectJson);
        }
        List<Map<String, Object>> filtered = filterChangesForSync(effectiveChanges, upgradeType);
        return Json2CodeDdlEngine.generateUpdateSql(
                projectJson, filtered, dialectCode, baselineProjectJson);
    }

    static List<Map<String, Object>> filterChangesForSync(
            List<Map<String, Object>> changes,
            String upgradeType) {
        if (UPGRADE_REBUILD.equalsIgnoreCase(upgradeType)) {
            Set<String> entityTitles = new LinkedHashSet<>();
            List<Map<String, Object>> entityUpdates = new ArrayList<>();
            for (Map<String, Object> c : changes) {
                if (VersionDiffKeys.TYPE_ENTITY.equals(c.get(VersionDiffKeys.TYPE))) {
                    entityUpdates.add(c);
                } else {
                    String name = ProjectJsonSupport.str(c.get(VersionDiffKeys.NAME));
                    int dot = name.indexOf('.');
                    if (dot > 0) {
                        entityTitles.add(name.substring(0, dot));
                    }
                }
            }
            List<Map<String, Object>> rebuilt = new ArrayList<>();
            for (String title : entityTitles) {
                rebuilt.add(Map.of(
                        VersionDiffKeys.TYPE, VersionDiffKeys.TYPE_ENTITY,
                        VersionDiffKeys.NAME, title,
                        VersionDiffKeys.OPT, VersionDiffKeys.OPT_UPDATE));
            }
            rebuilt.addAll(entityUpdates);
            return rebuilt;
        }
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> c : changes) {
            if (VersionDiffKeys.TYPE_ENTITY.equals(c.get(VersionDiffKeys.TYPE))
                    && VersionDiffKeys.OPT_UPDATE.equals(c.get(VersionDiffKeys.OPT))) {
                continue;
            }
            out.add(c);
        }
        return out;
    }
}
