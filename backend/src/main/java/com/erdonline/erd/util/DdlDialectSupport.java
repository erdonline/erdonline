package com.erdonline.erd.util;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * 方言码归一化、database 行选取、字段物理类型解析（与前端 json2code 对齐）。
 */
public final class DdlDialectSupport {

    private static final Set<String> FK_RULE_SET = Set.of(
            "CASCADE", "SET NULL", "SET DEFAULT", "RESTRICT", "NO ACTION");

    private DdlDialectSupport() {
    }

    public static String normalizeDialectCode(String code) {
        return str(code).toLowerCase(Locale.ROOT).replaceAll("[\\s_-]", "");
    }

    public static boolean dialectSupportsIndexFilter(String code) {
        String c = normalizeDialectCode(code);
        return c.equals("postgresql") || c.equals("postgres") || c.equals("pg")
                || c.equals("sqlserver") || c.equals("mssql");
    }

    public static boolean dialectSupportsForeignKey(String code) {
        String c = normalizeDialectCode(code);
        return c.equals("mysql") || c.equals("mariadb")
                || c.equals("postgresql") || c.equals("postgres") || c.equals("pg")
                || c.equals("sqlserver") || c.equals("mssql")
                || c.equals("oracle");
    }

    public static String normalizeFkRuleForSql(Object raw) {
        if (raw == null) {
            return null;
        }
        String s = str(raw).trim().toUpperCase(Locale.ROOT).replaceAll("\\s+", " ");
        if (s.isEmpty() || !FK_RULE_SET.contains(s)) {
            return null;
        }
        return s;
    }

    public static String suggestFkConstraintName(String fromEntity, List<String> fromFields, String toEntity) {
        String san = sanitizeIdent(fromEntity);
        String cols = fromFields.stream().map(DdlDialectSupport::sanitizeIdent).filter(x -> !x.isEmpty())
                .reduce((a, b) -> a + "_" + b).orElse("col");
        String base = "fk_" + san + "_" + cols;
        return base.length() <= 60 ? base : base.substring(0, 60);
    }

    public static Map<String, Object> pickDatabaseDialect(List<Map<String, Object>> databases, String code) {
        List<Map<String, Object>> list = databases != null ? databases : List.of();
        if (code != null && !code.isBlank()) {
            String norm = normalizeDialectCode(code);
            for (Map<String, Object> db : list) {
                if (normalizeDialectCode(str(db.get(ProjectJsonKeys.CODE))).equals(norm)) {
                    return db;
                }
            }
            for (Map<String, Object> db : list) {
                if (Objects.equals(db.get(ProjectJsonKeys.CODE), code)) {
                    return db;
                }
            }
        }
        for (Map<String, Object> db : list) {
            if (Boolean.TRUE.equals(db.get(ProjectJsonKeys.DEFAULT_DATABASE))) {
                return db;
            }
        }
        return list.isEmpty() ? Map.of() : list.get(0);
    }

    public static String resolveFieldType(List<Map<String, Object>> datatype, String typeCode, String dialectCode) {
        if (typeCode.isEmpty()) {
            return "";
        }
        String normDialect = normalizeDialectCode(dialectCode);
        for (Map<String, Object> dt : datatype) {
            if (!Objects.equals(dt.get(ProjectJsonKeys.CODE), typeCode)) {
                continue;
            }
            Map<String, Object> apply = ProjectJsonSupport.asMap(dt.get(ProjectJsonKeys.APPLY));
            for (Map.Entry<String, Object> e : apply.entrySet()) {
                if (normalizeDialectCode(e.getKey()).equals(normDialect) && e.getValue() instanceof Map<?, ?> m) {
                    Object t = m.get(ProjectJsonKeys.TYPE);
                    if (t != null) {
                        return String.valueOf(t);
                    }
                }
            }
        }
        return typeCode;
    }

    public static String quoteIdent(String ident, String dialectCode) {
        String d = normalizeDialectCode(dialectCode);
        if (d.equals("sqlserver") || d.equals("mssql")) {
            return "[" + ident.replace("]", "]]") + "]";
        }
        if (d.equals("oracle") || d.equals("postgresql") || d.equals("postgres") || d.equals("pg")) {
            return "\"" + ident.replace("\"", "\"\"") + "\"";
        }
        return "`" + ident.replace("`", "``") + "`";
    }

    public static String sqlSeparator(Map<String, Object> dataSource) {
        Map<String, Object> profile = ProjectJsonSupport.asMap(dataSource.get(ProjectJsonKeys.PROFILE));
        Object cfg = profile.get(ProjectJsonKeys.SQL_CONFIG);
        String sep = cfg != null ? String.valueOf(cfg) : DdlTemplateKeys.DEFAULT_SQL_SEPARATOR;
        return sep + "\n";
    }

    public static String dialectCodeFromDb(Map<String, Object> database, String fallbackDialect) {
        if (database != null && database.get(ProjectJsonKeys.CODE) != null) {
            return String.valueOf(database.get(ProjectJsonKeys.CODE));
        }
        return fallbackDialect;
    }

    public static String formatIndexFilterPredicate(Object filter) {
        String f = str(filter).trim();
        return f.isEmpty() ? null : f;
    }

    private static String sanitizeIdent(String s) {
        String t = str(s).trim().replaceAll("[^A-Za-z0-9_]+", "_").replaceAll("^_+|_+$", "");
        return t.isEmpty() ? "x" : t;
    }

    static String str(Object o) {
        return o == null ? "" : String.valueOf(o);
    }
}
