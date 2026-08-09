package com.erdonline.erd.util;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 全量 DDL（建表 + 索引 + 触发器 + 外键），后端移植自前端 {@code json2code.getAllDataSQL}。
 */
public final class Json2CodeFullDdlEngine {

    private static final String MODULE_NAME_KEY = "_moduleName";

    private Json2CodeFullDdlEngine() {
    }

    public static String generateAllSql(Map<String, Object> projectJson, String dialectCode) {
        if (projectJson == null || projectJson.isEmpty()) {
            return "";
        }
        List<Map<String, Object>> datatype = ProjectJsonSupport.datatypeList(projectJson);
        Map<String, Object> database = DdlDialectSupport.pickDatabaseDialect(
                ProjectJsonSupport.databaseList(projectJson), dialectCode);
        String resolvedDialect = DdlDialectSupport.dialectCodeFromDb(database, dialectCode);
        String separator = DdlDialectSupport.sqlSeparator(projectJson);

        StringBuilder out = new StringBuilder();
        for (Map<String, Object> entity : ProjectJsonSupport.allEntities(projectJson, MODULE_NAME_KEY)) {
            Map<String, Object> enriched = ProjectJsonSupport.enrichEntityFields(entity, datatype, resolvedDialect);
            Map<String, Object> ctx = templateContext(enriched, separator);

            out.append(DdlTemplateRenderer.render(
                    DdlTemplateKeys.CREATE_TABLE, resolvedDialect, database, ctx));

            for (Map<String, Object> index : ProjectJsonSupport.asMapList(enriched.get(ProjectJsonKeys.INDEXS))) {
                Map<String, Object> idxCtx = new LinkedHashMap<>(ctx);
                idxCtx.put(DdlTemplateKeys.CTX_INDEX, index);
                out.append(DdlIndexRenderer.renderCreateIndexSql(
                        templateText(DdlTemplateKeys.CREATE_INDEX, database),
                        idxCtx,
                        resolvedDialect));
            }

            for (Map<String, Object> trigger : ProjectJsonSupport.asMapList(enriched.get(ProjectJsonKeys.TRIGGERS))) {
                out.append(renderTriggerSql(trigger, enriched, separator, resolvedDialect));
            }

            out.append(renderEntityForeignKeys(projectJson, enriched, separator, resolvedDialect));
        }

        String result = out.toString();
        return result.endsWith(separator) ? result : result + separator;
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
