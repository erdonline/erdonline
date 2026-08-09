package com.erdonline.erd.util;

import java.util.List;
import java.util.Map;

/**
 * 版本增量 DDL 门面：委托 {@link Json2CodeDdlEngine}（Freemarker + doT 兼容层）。
 *
 * @deprecated 直接调用 {@link Json2CodeDdlEngine#generateUpdateSql}；本类保留兼容旧引用。
 */
public final class VersionDdlEngine {

    private VersionDdlEngine() {
    }

    public static String generateIncrementalSql(
            Map<String, Object> projectJson,
            Map<String, Object> baselineProjectJson,
            List<Map<String, Object>> changes,
            String dialectCode) {
        return Json2CodeDdlEngine.generateUpdateSql(projectJson, changes, dialectCode, baselineProjectJson);
    }

    /** @deprecated 使用 {@link DdlDialectSupport#pickDatabaseDialect} */
    @Deprecated
    public static Map<String, Object> pickDatabaseDialect(List<Map<String, Object>> databases, String code) {
        return DdlDialectSupport.pickDatabaseDialect(databases, code);
    }

    /** @deprecated 使用 {@link DdlDialectSupport#normalizeDialectCode} */
    @Deprecated
    public static String normalizeDialectCode(String code) {
        return DdlDialectSupport.normalizeDialectCode(code);
    }
}
