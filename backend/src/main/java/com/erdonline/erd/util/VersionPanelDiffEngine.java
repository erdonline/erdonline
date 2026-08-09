package com.erdonline.erd.util;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 版本详情 / 比对面板：一次调用产出对齐的 structural diff + 增量 DDL。
 * 前端只展示，不得重算 diff 或独立生成 SQL。
 */
public final class VersionPanelDiffEngine {

    private VersionPanelDiffEngine() {
    }

    /**
     * @param current          当前版本快照 projectJSON
     * @param baseline         基线快照（空 map = 空模型）
     * @param dialectCode      JDBC 方言，如 MYSQL / PostgreSQL
     */
    public static Map<String, Object> compute(
            Map<String, Object> current,
            Map<String, Object> baseline,
            String dialectCode) {
        Map<String, Object> cur = current != null ? current : Map.of();
        Map<String, Object> base = baseline != null ? baseline : Map.of();
        List<Map<String, Object>> changes = VersionDiffEngine.diff(cur, base);
        String ddl = VersionDdlEngine.generateIncrementalSql(cur, base, changes, dialectCode);
        Map<String, Object> result = new HashMap<>();
        result.put("changes", changes);
        result.put("ddl", ddl);
        return result;
    }
}
