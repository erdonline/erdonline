package com.erdonline.erd.util;

import org.springframework.util.StringUtils;

import java.util.Map;

/**
 * 版本通道 db_key 规范化（ADR-0008）。
 * <p>
 * 历史 dogfood / Public API 曾硬编码 {@code defaultDB}、{@code SNAPSHOT}；
 * 产品侧 JDBC 通道用 {@code data_sources.id}，无 JDBC 时用 {@link #SNAPSHOT_KEY}。
 */
public final class VersionDbKeyResolver {

    public static final String SNAPSHOT_KEY = "__erd_snapshot__";

    private static final String LEGACY_SNAPSHOT = "SNAPSHOT";
    private static final String LEGACY_DEFAULT = "defaultDB";

    private VersionDbKeyResolver() {
    }

    public static String resolve(String dbKey, String defaultDataSourceId) {
        if (!StringUtils.hasText(dbKey)) {
            return dbKey;
        }
        String trimmed = dbKey.trim();
        if (LEGACY_SNAPSHOT.equalsIgnoreCase(trimmed)) {
            return SNAPSHOT_KEY;
        }
        if (LEGACY_DEFAULT.equalsIgnoreCase(trimmed) && StringUtils.hasText(defaultDataSourceId)) {
            return defaultDataSourceId.trim();
        }
        return trimmed;
    }

    @SuppressWarnings("unchecked")
    public static String defaultDataSourceIdFromProjectJson(Map<String, Object> projectJSON) {
        if (projectJSON == null) {
            return null;
        }
        Object profileRaw = projectJSON.get("profile");
        if (!(profileRaw instanceof Map)) {
            return null;
        }
        Object id = ((Map<String, Object>) profileRaw).get("defaultDataSourceId");
        if (id == null) {
            return null;
        }
        String s = String.valueOf(id).trim();
        return s.isEmpty() || "null".equalsIgnoreCase(s) ? null : s;
    }
}
