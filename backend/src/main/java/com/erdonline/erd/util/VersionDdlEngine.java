package com.erdonline.erd.util;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 由 {@link VersionDiffEngine} 产出的 changes 生成增量 DDL（与前端 json2code.generateUpdateSql 语义对齐）。
 * profile / datatype / diagram 等元数据变更只出现在 changes，不生成 SQL。
 */
public final class VersionDdlEngine {

    private VersionDdlEngine() {
    }

    public static String generateIncrementalSql(
            Map<String, Object> projectJson,
            Map<String, Object> baselineProjectJson,
            List<Map<String, Object>> changes,
            String dialectCode) {
        if (changes == null || changes.isEmpty()) {
            return "";
        }
        Map<String, Object> dataSource = projectJson != null ? projectJson : Map.of();
        Map<String, Object> oldDataSource = baselineProjectJson != null ? baselineProjectJson : Map.of();
        String dialect = normalizeDialectCode(dialectCode);
        String separator = sqlSeparator(dataSource);
        List<Map<String, Object>> datatype = datatypeList(dataSource);
        Map<String, Object> database = pickDatabaseDialect(databaseList(dataSource), dialectCode);

        List<Map<String, Object>> filtered = filterFieldUpdates(changes);
        StringBuilder out = new StringBuilder();

        appendEntitySql(out, filtered, dataSource, oldDataSource, datatype, database, dialect, separator);
        appendIndexSql(out, filtered, dataSource, datatype, database, dialect, separator);
        appendFieldSql(out, filtered, dataSource, datatype, database, dialect, separator);
        appendAssociationSql(out, filtered, dataSource, dialect, separator);

        return out.toString().trim();
    }

    private static void appendEntitySql(
            StringBuilder out,
            List<Map<String, Object>> changes,
            Map<String, Object> dataSource,
            Map<String, Object> oldDataSource,
            List<Map<String, Object>> datatype,
            Map<String, Object> database,
            String dialect,
            String separator) {
        List<Map<String, Object>> entities = allEntities(dataSource);
        for (Map<String, Object> c : changes) {
            if (!"entity".equals(c.get("type"))) {
                continue;
            }
            String opt = String.valueOf(c.get("opt"));
            String tableName = String.valueOf(c.get("name"));
            if ("add".equals(opt)) {
                Map<String, Object> entity = findEntityByTitle(entities, tableName);
                if (entity == null) {
                    continue;
                }
                String fromTemplate = renderCreateTableFromTemplate(database, entity, moduleName(entity), separator);
                if (!fromTemplate.isBlank() && fromTemplate.contains(String.valueOf(entity.get("title")))) {
                    out.append(fromTemplate);
                } else {
                    out.append(buildCreateTableSql(entity, datatype, dialectCodeFromDb(database, dialect), separator));
                }
            } else if ("delete".equals(opt)) {
                out.append("DROP TABLE ").append(quoteIdent(tableName, dialect)).append(';').append(separator);
            } else if ("update".equals(opt)) {
                String name = String.valueOf(c.get("name"));
                if (name.contains(".") && name.endsWith(".chnname")) {
                    String title = name.split("\\.", 2)[0];
                    out.append("-- comment update for table ").append(title).append(separator);
                }
            }
        }
        out.append("\r\n");
    }

    private static void appendIndexSql(
            StringBuilder out,
            List<Map<String, Object>> changes,
            Map<String, Object> dataSource,
            List<Map<String, Object>> datatype,
            Map<String, Object> database,
            String dialect,
            String separator) {
        List<Map<String, Object>> entities = allEntities(dataSource);
        for (Map<String, Object> c : changes) {
            if (!"index".equals(c.get("type"))) {
                continue;
            }
            String[] parts = String.valueOf(c.get("name")).split("\\.", 2);
            if (parts.length < 2) {
                continue;
            }
            String tableTitle = parts[0];
            String indexName = parts[1];
            Map<String, Object> entity = findEntityByTitle(entities, tableTitle);
            if (entity == null) {
                continue;
            }
            String opt = String.valueOf(c.get("opt"));
            if ("add".equals(opt)) {
                Map<String, Object> index = findIndexByName(entity, indexName);
                if (index != null) {
                    out.append(buildCreateIndexSql(entity, index, dialect, separator));
                }
            } else if ("delete".equals(opt)) {
                out.append("DROP INDEX ").append(quoteIdent(indexName, dialect))
                        .append(" ON ").append(quoteIdent(tableTitle, dialect)).append(';').append(separator);
            }
        }
        out.append("\r\n");
    }

    private static void appendFieldSql(
            StringBuilder out,
            List<Map<String, Object>> changes,
            Map<String, Object> dataSource,
            List<Map<String, Object>> datatype,
            Map<String, Object> database,
            String dialect,
            String separator) {
        List<Map<String, Object>> entities = allEntities(dataSource);
        for (Map<String, Object> c : changes) {
            if (!"field".equals(c.get("type"))) {
                continue;
            }
            String[] parts = String.valueOf(c.get("name")).split("\\.");
            if (parts.length < 2) {
                continue;
            }
            String tableTitle = parts[0];
            String fieldName = parts[1];
            Map<String, Object> entity = findEntityByTitle(entities, tableTitle);
            if (entity == null) {
                continue;
            }
            String opt = String.valueOf(c.get("opt"));
            String dialectCode = dialectCodeFromDb(database, dialect);
            if ("add".equals(opt)) {
                Map<String, Object> field = findFieldByName(entity, fieldName);
                if (field != null) {
                    out.append("ALTER TABLE ").append(quoteIdent(tableTitle, dialect))
                            .append(" ADD COLUMN ").append(formatColumn(field, datatype, dialectCode))
                            .append(';').append(separator);
                }
            } else if ("delete".equals(opt)) {
                out.append("ALTER TABLE ").append(quoteIdent(tableTitle, dialect))
                        .append(" DROP COLUMN ").append(quoteIdent(fieldName, dialect))
                        .append(';').append(separator);
            } else if ("update".equals(opt)) {
                Map<String, Object> field = findFieldByName(entity, fieldName);
                if (field != null && parts.length >= 3) {
                    out.append("ALTER TABLE ").append(quoteIdent(tableTitle, dialect))
                            .append(" MODIFY COLUMN ").append(formatColumn(field, datatype, dialectCode))
                            .append(';').append(separator);
                }
            }
        }
        out.append("\r\n");
    }

    private static void appendAssociationSql(
            StringBuilder out,
            List<Map<String, Object>> changes,
            Map<String, Object> dataSource,
            String dialect,
            String separator) {
        for (Map<String, Object> c : changes) {
            if (!"association".equals(c.get("type")) || !"add".equals(c.get("opt"))) {
                continue;
            }
            Map<String, Object> assoc = findAssociationByChangeName(dataSource, String.valueOf(c.get("name")));
            if (assoc == null) {
                continue;
            }
            String fk = buildForeignKeySql(assoc, dialect);
            if (!fk.isBlank()) {
                out.append(fk);
                if (!fk.endsWith(";")) {
                    out.append(';');
                }
                out.append(separator);
            }
        }
        out.append("\r\n");
    }

    static String buildCreateTableSql(
            Map<String, Object> entity,
            List<Map<String, Object>> datatype,
            String dialectCode,
            String separator) {
        String title = String.valueOf(entity.get("title"));
        String dialect = normalizeDialectCode(dialectCode);
        List<Map<String, Object>> fields = asMapList(entity.get("fields"));
        List<String> pkCols = new ArrayList<>();
        StringBuilder cols = new StringBuilder();
        for (int i = 0; i < fields.size(); i++) {
            Map<String, Object> field = fields.get(i);
            if (Boolean.TRUE.equals(field.get("pk"))) {
                pkCols.add(String.valueOf(field.get("name")));
            }
            cols.append("  ").append(formatColumn(field, datatype, dialectCode));
            boolean needComma = i < fields.size() - 1 || !pkCols.isEmpty();
            if (needComma) {
                cols.append(',');
            }
            cols.append('\n');
        }
        if (!pkCols.isEmpty()) {
            cols.append("  PRIMARY KEY (")
                    .append(pkCols.stream().map(n -> quoteIdent(n, dialect)).collect(Collectors.joining(", ")))
                    .append(")\n");
        }
        return "CREATE TABLE " + quoteIdent(title, dialect) + "(\n" + cols + ");" + separator;
    }

    static String buildForeignKeySql(Map<String, Object> assoc, String dialect) {
        Map<String, Object> from = asMap(assoc.get("from"));
        Map<String, Object> to = asMap(assoc.get("to"));
        String fromEntity = str(from.get("entity"));
        String toEntity = str(to.get("entity"));
        String fromField = str(from.get("field"));
        String toField = str(to.get("field"));
        if (fromEntity.isEmpty() || toEntity.isEmpty() || fromField.isEmpty() || toField.isEmpty()) {
            return "";
        }
        String constraintName = str(assoc.get("constraintName"));
        if (constraintName.isEmpty()) {
            constraintName = "fk_" + fromEntity + "_" + fromField;
        }
        String d = normalizeDialectCode(dialect);
        return "ALTER TABLE " + quoteIdent(fromEntity, d)
                + " ADD CONSTRAINT " + quoteIdent(constraintName, d)
                + " FOREIGN KEY (" + quoteIdent(fromField, d) + ")"
                + " REFERENCES " + quoteIdent(toEntity, d)
                + " (" + quoteIdent(toField, d) + ")";
    }

    static String buildCreateIndexSql(
            Map<String, Object> entity,
            Map<String, Object> index,
            String dialect,
            String separator) {
        String table = String.valueOf(entity.get("title"));
        String indexName = String.valueOf(index.get("name"));
        List<Object> fieldNames = asList(index.get("fields"));
        String cols = fieldNames.stream()
                .map(String::valueOf)
                .map(f -> quoteIdent(f, dialect))
                .collect(Collectors.joining(", "));
        String unique = Boolean.TRUE.equals(index.get("isUnique")) ? "UNIQUE " : "";
        return "CREATE " + unique + "INDEX " + quoteIdent(indexName, dialect)
                + " ON " + quoteIdent(table, dialect) + " (" + cols + ");" + separator;
    }

    static String renderCreateTableFromTemplate(
            Map<String, Object> database,
            Map<String, Object> entity,
            String moduleName,
            String separator) {
        if (database == null) {
            return "";
        }
        Object tpl = database.get("createTableTemplate");
        if (!(tpl instanceof String) || ((String) tpl).isBlank()) {
            return "";
        }
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("entity", entity);
        context.put("module", Map.of("name", moduleName));
        context.put("separator", separator);
        return ErdDotTemplateEngine.render((String) tpl, context);
    }

    static Map<String, Object> pickDatabaseDialect(List<Map<String, Object>> databases, String code) {
        List<Map<String, Object>> list = databases != null ? databases : List.of();
        if (code != null && !code.isBlank()) {
            String norm = normalizeDialectCode(code);
            for (Map<String, Object> db : list) {
                if (normalizeDialectCode(str(db.get("code"))).equals(norm)) {
                    return db;
                }
            }
            for (Map<String, Object> db : list) {
                if (Objects.equals(db.get("code"), code)) {
                    return db;
                }
            }
        }
        for (Map<String, Object> db : list) {
            if (Boolean.TRUE.equals(db.get("defaultDatabase"))) {
                return db;
            }
        }
        return list.isEmpty() ? Map.of() : list.get(0);
    }

    static String normalizeDialectCode(String code) {
        return str(code).toLowerCase(Locale.ROOT).replaceAll("[\\s_-]", "");
    }

    static String quoteIdent(String ident, String dialect) {
        String d = normalizeDialectCode(dialect);
        if (d.equals("sqlserver") || d.equals("mssql")) {
            return "[" + ident.replace("]", "]]") + "]";
        }
        if (d.equals("oracle") || d.equals("postgresql") || d.equals("postgres") || d.equals("pg")) {
            return "\"" + ident.replace("\"", "\"\"") + "\"";
        }
        return "`" + ident.replace("`", "``") + "`";
    }

    static String formatColumn(Map<String, Object> field, List<Map<String, Object>> datatype, String dialectCode) {
        String name = str(field.get("name"));
        String type = resolveFieldType(datatype, str(field.get("type")), dialectCode);
        if (type.isEmpty()) {
            type = str(field.get("type"));
        }
        String dialect = normalizeDialectCode(dialectCode);
        StringBuilder sb = new StringBuilder();
        sb.append(quoteIdent(name, dialect)).append(' ').append(type);
        if (Boolean.TRUE.equals(field.get("notNull"))) {
            sb.append(" NOT NULL");
        }
        if (Boolean.TRUE.equals(field.get("autoIncrement"))) {
            sb.append(" AUTO_INCREMENT");
        }
        Object def = field.get("defaultValue");
        if (def != null && !String.valueOf(def).isBlank()) {
            sb.append(" DEFAULT ").append(def);
        }
        return sb.toString();
    }

    static String resolveFieldType(List<Map<String, Object>> datatype, String typeCode, String dialectCode) {
        if (typeCode.isEmpty()) {
            return "";
        }
        String normDialect = normalizeDialectCode(dialectCode);
        for (Map<String, Object> dt : datatype) {
            if (!Objects.equals(dt.get("code"), typeCode)) {
                continue;
            }
            Map<String, Object> apply = asMap(dt.get("apply"));
            for (Map.Entry<String, Object> e : apply.entrySet()) {
                if (normalizeDialectCode(e.getKey()).equals(normDialect) && e.getValue() instanceof Map) {
                    Object t = ((Map<?, ?>) e.getValue()).get("type");
                    if (t != null) {
                        return String.valueOf(t);
                    }
                }
            }
        }
        return typeCode;
    }

    static List<Map<String, Object>> filterFieldUpdates(List<Map<String, Object>> changes) {
        Set<String> seen = new HashSet<>();
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> c : changes) {
            if ("field".equals(c.get("type")) && "update".equals(c.get("opt"))) {
                String name = String.valueOf(c.get("name"));
                String[] parts = name.split("\\.");
                if (parts.length >= 2) {
                    String key = parts[0] + "." + parts[1];
                    if (seen.contains(key)) {
                        continue;
                    }
                    seen.add(key);
                }
            }
            out.add(c);
        }
        return out;
    }

    static Map<String, Object> findAssociationByChangeName(Map<String, Object> dataSource, String changeName) {
        int dot = changeName.indexOf('.');
        if (dot <= 0) {
            return null;
        }
        String moduleName = changeName.substring(0, dot);
        String tail = changeName.substring(dot + 1);
        for (Map<String, Object> mod : asMapList(dataSource.get("modules"))) {
            if (!Objects.equals(mod.get("name"), moduleName)) {
                continue;
            }
            for (Map<String, Object> a : asMapList(mod.get("associations"))) {
                String key = VersionDiffEngine.associationKey(a);
                if (tail.equals(key) || tail.startsWith(key + ".")) {
                    return a;
                }
            }
        }
        return null;
    }

    static List<Map<String, Object>> allEntities(Map<String, Object> dataSource) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> mod : asMapList(dataSource.get("modules"))) {
            for (Map<String, Object> e : asMapList(mod.get("entities"))) {
                Map<String, Object> copy = new LinkedHashMap<>(e);
                copy.put("_moduleName", mod.get("name"));
                result.add(copy);
            }
        }
        return result;
    }

    static Map<String, Object> findEntityByTitle(List<Map<String, Object>> entities, String title) {
        for (Map<String, Object> e : entities) {
            if (Objects.equals(String.valueOf(e.get("title")), title)) {
                return e;
            }
        }
        return null;
    }

    static Map<String, Object> findFieldByName(Map<String, Object> entity, String name) {
        for (Map<String, Object> f : asMapList(entity.get("fields"))) {
            if (Objects.equals(String.valueOf(f.get("name")), name)) {
                return f;
            }
        }
        return null;
    }

    static Map<String, Object> findIndexByName(Map<String, Object> entity, String name) {
        for (Map<String, Object> idx : asMapList(entity.get("indexs"))) {
            if (Objects.equals(String.valueOf(idx.get("name")), name)) {
                return idx;
            }
        }
        return null;
    }

    static String moduleName(Map<String, Object> entity) {
        Object m = entity.get("_moduleName");
        return m != null ? String.valueOf(m) : "";
    }

    static String sqlSeparator(Map<String, Object> dataSource) {
        Map<String, Object> profile = asMap(dataSource.get("profile"));
        Object cfg = profile.get("sqlConfig");
        String sep = cfg != null ? String.valueOf(cfg) : "/*SQL@Run*/";
        return sep + "\n";
    }

    static String dialectCodeFromDb(Map<String, Object> database, String fallbackDialect) {
        if (database != null && database.get("code") != null) {
            return String.valueOf(database.get("code"));
        }
        return fallbackDialect;
    }

    static List<Map<String, Object>> datatypeList(Map<String, Object> dataSource) {
        Map<String, Object> domains = asMap(dataSource.get("dataTypeDomains"));
        return asMapList(domains.get("datatype"));
    }

    static List<Map<String, Object>> databaseList(Map<String, Object> dataSource) {
        Map<String, Object> domains = asMap(dataSource.get("dataTypeDomains"));
        return asMapList(domains.get("database"));
    }

    @SuppressWarnings("unchecked")
    static Map<String, Object> asMap(Object o) {
        if (o instanceof Map) {
            return (Map<String, Object>) o;
        }
        return Map.of();
    }

    @SuppressWarnings("unchecked")
    static List<Object> asList(Object o) {
        if (o instanceof List) {
            return (List<Object>) o;
        }
        return List.of();
    }

    static List<Map<String, Object>> asMapList(Object o) {
        List<Map<String, Object>> result = new ArrayList<>();
        if (o instanceof List) {
            for (Object item : (List<?>) o) {
                if (item instanceof Map) {
                    result.add(asMap(item));
                }
            }
        }
        return result;
    }

    static String str(Object o) {
        return o == null ? "" : String.valueOf(o);
    }
}
