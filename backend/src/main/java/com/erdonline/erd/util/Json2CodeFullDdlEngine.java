package com.erdonline.erd.util;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;

/**
 * 全量 DDL（建表 + 索引 + 触发器 + 外键），后端移植自前端 {@code json2code.getAllDataSQL}。
 */
public final class Json2CodeFullDdlEngine {

    private static final String MODULE_NAME_KEY = "_moduleName";

    private Json2CodeFullDdlEngine() {
    }

    public static String generateAllSql(Map<String, Object> projectJson, String dialectCode) {
        return generateAllSqlByFilter(projectJson, dialectCode, DdlExportFilterKeys.allSegments(), null);
    }

    /**
     * 按片段键拼全量 DDL（删表/建表/索引/触发器/外键/注释），与前端 {@code getAllDataSQLByFilter} 对齐。
     *
     * @param entityTitles 非空时仅导出这些 {@code entity.title}
     */
    public static String generateAllSqlByFilter(
            Map<String, Object> projectJson,
            String dialectCode,
            List<String> filter,
            List<String> entityTitles) {
        if (projectJson == null || projectJson.isEmpty()) {
            return "";
        }
        List<String> segments = normalizeFilter(filter);
        if (segments.isEmpty()) {
            return "";
        }
        Set<String> titleFilter = entityTitles == null || entityTitles.isEmpty()
                ? null
                : new HashSet<>(entityTitles);

        List<Map<String, Object>> datatype = ProjectJsonSupport.datatypeList(projectJson);
        Map<String, Object> database = DdlDialectSupport.pickDatabaseDialect(
                ProjectJsonSupport.databaseList(projectJson), dialectCode);
        String resolvedDialect = DdlDialectSupport.dialectCodeFromDb(database, dialectCode);
        String separator = DdlDialectSupport.sqlSeparator(projectJson);

        StringBuilder out = new StringBuilder();
        for (Map<String, Object> entity : ProjectJsonSupport.allEntities(projectJson, MODULE_NAME_KEY)) {
            String title = ProjectJsonSupport.str(entity.get(ProjectJsonKeys.TITLE));
            if (titleFilter != null && !titleFilter.contains(title)) {
                continue;
            }
            Map<String, Object> enriched = ProjectJsonSupport.enrichEntityFields(entity, datatype, resolvedDialect);
            Map<String, Object> ctx = templateContext(enriched, separator);

            for (String segment : segments) {
                out.append(renderSegment(
                        segment, projectJson, enriched, ctx, database, resolvedDialect, separator));
            }
        }
        return out.toString();
    }

    private static List<String> normalizeFilter(List<String> filter) {
        if (filter == null || filter.isEmpty()) {
            return DdlExportFilterKeys.allSegments();
        }
        List<String> out = new ArrayList<>();
        for (String key : filter) {
            if (DdlExportFilterKeys.isKnown(key)) {
                out.add(key);
            }
        }
        return out;
    }

    private static String renderSegment(
            String segment,
            Map<String, Object> projectJson,
            Map<String, Object> enriched,
            Map<String, Object> ctx,
            Map<String, Object> database,
            String resolvedDialect,
            String separator) {
        return switch (segment) {
            case DdlExportFilterKeys.DELETE_TABLE -> DdlTemplateRenderer.render(
                    DdlTemplateKeys.DELETE_TABLE, resolvedDialect, database, ctx);
            case DdlExportFilterKeys.CREATE_TABLE -> DdlTemplateRenderer.render(
                    DdlTemplateKeys.CREATE_TABLE, resolvedDialect, database, ctx);
            case DdlExportFilterKeys.CREATE_INDEX -> renderAllIndexes(database, ctx, resolvedDialect);
            case DdlExportFilterKeys.CREATE_TRIGGER -> renderAllTriggers(enriched, separator, resolvedDialect);
            case DdlExportFilterKeys.CREATE_FOREIGN_KEY -> renderEntityForeignKeys(
                    projectJson, enriched, separator, resolvedDialect);
            case DdlExportFilterKeys.UPDATE_COMMENT -> DdlTemplateRenderer.render(
                    DdlTemplateKeys.UPDATE_TABLE_COMMENT, resolvedDialect, database, ctx);
            default -> "";
        };
    }

    private static String renderAllIndexes(
            Map<String, Object> database,
            Map<String, Object> ctx,
            String resolvedDialect) {
        Map<String, Object> entity = ProjectJsonSupport.asMap(ctx.get(DdlTemplateKeys.CTX_ENTITY));
        StringBuilder out = new StringBuilder();
        for (Map<String, Object> index : ProjectJsonSupport.asMapList(entity.get(ProjectJsonKeys.INDEXS))) {
            Map<String, Object> idxCtx = new LinkedHashMap<>(ctx);
            idxCtx.put(DdlTemplateKeys.CTX_INDEX, index);
            out.append(DdlIndexRenderer.renderCreateIndexSql(
                    templateText(DdlTemplateKeys.CREATE_INDEX, database),
                    idxCtx,
                    resolvedDialect));
        }
        return out.toString();
    }

    private static String renderAllTriggers(
            Map<String, Object> enriched,
            String separator,
            String resolvedDialect) {
        StringBuilder out = new StringBuilder();
        for (Map<String, Object> trigger : ProjectJsonSupport.asMapList(enriched.get(ProjectJsonKeys.TRIGGERS))) {
            out.append(renderTriggerSql(trigger, enriched, separator, resolvedDialect));
        }
        return out.toString();
    }

    private static String renderEntityForeignKeys(
            Map<String, Object> dataSource,
            Map<String, Object> entity,
            String separator,
            String dialectCode) {
        String tableTitle = ProjectJsonSupport.str(entity.get(ProjectJsonKeys.TITLE));
        if (tableTitle.isEmpty()) {
            return "";
        }
        List<Map<String, Object>> associations = new ArrayList<>();
        for (Map<String, Object> mod : ProjectJsonSupport.asMapList(dataSource.get(ProjectJsonKeys.MODULES))) {
            for (Map<String, Object> a : ProjectJsonSupport.asMapList(mod.get(ProjectJsonKeys.ASSOCIATIONS))) {
                Map<String, Object> from = ProjectJsonSupport.asMap(a.get("from"));
                if (tableTitle.equals(ProjectJsonSupport.str(from.get("entity")))) {
                    associations.add(a);
                }
            }
        }
        StringBuilder out = new StringBuilder();
        for (DdlForeignKeyRenderer.ForeignKeyGroup g : DdlForeignKeyRenderer.groupAssociationsForFk(associations)) {
            out.append(DdlForeignKeyRenderer.renderCreateForeignKeySql(g, separator, dialectCode));
        }
        return out.toString();
    }

    private static String renderTriggerSql(
            Map<String, Object> trigger,
            Map<String, Object> entity,
            String separator,
            String dialectCode) {
        if (!dialectSupportsTrigger(dialectCode)) {
            return "";
        }
        String existing = ProjectJsonSupport.str(trigger.get("ddl")).trim();
        if (!existing.isEmpty()) {
            String stmt = existing.matches(".*;\\s*$") ? existing : existing + ";";
            return stmt + separator;
        }
        String name = ProjectJsonSupport.str(trigger.get(ProjectJsonKeys.NAME)).trim();
        String statement = ProjectJsonSupport.str(trigger.get("statement")).trim();
        if (name.isEmpty() && statement.isEmpty()) {
            return "";
        }
        String table = ProjectJsonSupport.str(entity.get(ProjectJsonKeys.TITLE)).trim();
        String timing = ProjectJsonSupport.str(trigger.get("timing")).trim();
        String event = ProjectJsonSupport.str(trigger.get("event")).trim();
        if (table.isEmpty() || name.isEmpty()) {
            return "";
        }
        String ddl = "CREATE TRIGGER " + name + " " + timing + " " + event
                + " ON " + DdlDialectSupport.quoteIdent(table, dialectCode)
                + " FOR EACH ROW " + statement;
        return ddl + ";" + separator;
    }

    private static boolean dialectSupportsTrigger(String dialectCode) {
        String c = DdlDialectSupport.normalizeDialectCode(dialectCode);
        return c.equals("mysql") || c.equals("mariadb")
                || c.equals("postgresql") || c.equals("postgres") || c.equals("pg")
                || c.equals("oracle")
                || c.equals("sqlserver") || c.equals("mssql");
    }

    private static Map<String, Object> templateContext(Map<String, Object> entity, String separator) {
        Map<String, Object> ctx = new LinkedHashMap<>();
        ctx.put(DdlTemplateKeys.CTX_MODULE, Map.of(ProjectJsonKeys.NAME, moduleName(entity)));
        ctx.put(DdlTemplateKeys.CTX_ENTITY, entity);
        ctx.put(DdlTemplateKeys.CTX_SEPARATOR, separator);
        return ctx;
    }

    private static String templateText(String templateKey, Map<String, Object> database) {
        if (database == null) {
            return "";
        }
        Object tpl = database.get(templateKey);
        return tpl != null ? String.valueOf(tpl) : "";
    }

    private static String moduleName(Map<String, Object> entity) {
        Object m = entity.get(MODULE_NAME_KEY);
        return m != null ? String.valueOf(m) : "";
    }
}
