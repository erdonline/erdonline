package com.erdonline.erd.util;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 单表 DDL 预览：后端移植自前端 {@code json2code.getCodeByDataTable}。
 */
public final class Json2CodeTableDdlEngine {

    private static final String MODULE_NAME_KEY = "_moduleName";

    private Json2CodeTableDdlEngine() {
    }

    public static String generateTableSql(
            Map<String, Object> projectJson,
            String moduleName,
            Map<String, Object> dataTable,
            String dialectCode,
            String templateKey,
            List<Map<String, Object>> changes,
            Map<String, Object> oldProjectJson) {
        if (projectJson == null || dataTable == null || templateKey == null || templateKey.isBlank()) {
            return "";
        }
        List<Map<String, Object>> safeChanges = changes != null ? changes : List.of();
        Map<String, Object> oldJson = oldProjectJson != null ? oldProjectJson : Map.of();

        if (DdlTemplateKeys.CREATE_TABLE.equals(templateKey)
                || DdlTemplateKeys.DELETE_TABLE.equals(templateKey)
                || DdlTemplateKeys.CREATE_INDEX.equals(templateKey)) {
            return generateIncreaseSql(projectJson, moduleName, dataTable, dialectCode, templateKey);
        }
        if (DdlTemplateKeys.REBUILD_TABLE.equals(templateKey)) {
            return generateRebuildSql(projectJson, safeChanges, dialectCode, oldJson);
        }
        return Json2CodeDdlEngine.generateUpdateSql(projectJson, safeChanges, dialectCode, oldJson);
    }

    private static String generateIncreaseSql(
            Map<String, Object> projectJson,
            String moduleName,
            Map<String, Object> dataTable,
            String dialectCode,
            String templateKey) {
        List<Map<String, Object>> datatype = ProjectJsonSupport.datatypeList(projectJson);
        Map<String, Object> database = DdlDialectSupport.pickDatabaseDialect(
                ProjectJsonSupport.databaseList(projectJson), dialectCode);
        String resolvedDialect = DdlDialectSupport.dialectCodeFromDb(database, dialectCode);
        String separator = DdlDialectSupport.sqlSeparator(projectJson);

        Map<String, Object> enriched = new LinkedHashMap<>(dataTable);
        enriched.put(MODULE_NAME_KEY, moduleName);
        enriched = ProjectJsonSupport.enrichEntityFields(enriched, datatype, resolvedDialect);

        Map<String, Object> ctx = templateContext(enriched, moduleName, separator);

        if (DdlTemplateKeys.CREATE_INDEX.equals(templateKey)) {
            StringBuilder out = new StringBuilder();
            for (Map<String, Object> index : ProjectJsonSupport.asMapList(enriched.get(ProjectJsonKeys.INDEXS))) {
                Map<String, Object> idxCtx = new LinkedHashMap<>(ctx);
                idxCtx.put(DdlTemplateKeys.CTX_INDEX, index);
                out.append(DdlIndexRenderer.renderCreateIndexSql(
                        templateText(DdlTemplateKeys.CREATE_INDEX, database),
                        idxCtx,
                        resolvedDialect));
            }
            return out.toString();
        }

        return DdlTemplateRenderer.render(templateKey, resolvedDialect, database, ctx);
    }

    private static String generateRebuildSql(
            Map<String, Object> projectJson,
            List<Map<String, Object>> changes,
            String dialectCode,
            Map<String, Object> oldProjectJson) {
        List<Map<String, Object>> datatype = ProjectJsonSupport.datatypeList(projectJson);
        Map<String, Object> database = DdlDialectSupport.pickDatabaseDialect(
                ProjectJsonSupport.databaseList(projectJson), dialectCode);
        String resolvedDialect = DdlDialectSupport.dialectCodeFromDb(database, dialectCode);
        String separator = DdlDialectSupport.sqlSeparator(projectJson);

        List<Map<String, Object>> tempEntities = enrichAllEntities(projectJson, datatype, resolvedDialect);
        List<Map<String, Object>> oldEntities = enrichAllEntities(oldProjectJson, datatype, resolvedDialect);

        Set<String> tableTitles = new HashSet<>();
        for (Map<String, Object> c : changes) {
            if (!VersionDiffKeys.TYPE_FIELD.equals(c.get(VersionDiffKeys.TYPE))) {
                continue;
            }
            String name = ProjectJsonSupport.str(c.get(VersionDiffKeys.NAME));
            int dot = name.indexOf('.');
            if (dot > 0) {
                tableTitles.add(name.substring(0, dot));
            }
        }

        StringBuilder out = new StringBuilder();
        for (String tableTitle : tableTitles) {
            Map<String, Object> dataTable = ProjectJsonSupport.findEntityByTitle(tempEntities, tableTitle);
            Map<String, Object> oldDataTable = ProjectJsonSupport.findEntityByTitle(oldEntities, tableTitle);
            if (dataTable == null || oldDataTable == null) {
                continue;
            }
            Map<String, Object> ctx = new LinkedHashMap<>();
            ctx.put(DdlTemplateKeys.CTX_MODULE, Map.of(ProjectJsonKeys.NAME, moduleName(dataTable)));
            ctx.put(DdlTemplateKeys.CTX_OLD_ENTITY, oldDataTable);
            ctx.put(DdlTemplateKeys.CTX_NEW_ENTITY, dataTable);
            ctx.put(DdlTemplateKeys.CTX_SEPARATOR, separator);
            out.append(DdlTemplateRenderer.render(
                    DdlTemplateKeys.REBUILD_TABLE, resolvedDialect, database, ctx));
        }
        return out.toString();
    }

    private static Map<String, Object> templateContext(
            Map<String, Object> entity,
            String moduleName,
            String separator) {
        Map<String, Object> ctx = new LinkedHashMap<>();
        ctx.put(DdlTemplateKeys.CTX_MODULE, Map.of(ProjectJsonKeys.NAME, moduleName));
        ctx.put(DdlTemplateKeys.CTX_ENTITY, entity);
        ctx.put(DdlTemplateKeys.CTX_SEPARATOR, separator);
        return ctx;
    }

    private static List<Map<String, Object>> enrichAllEntities(
            Map<String, Object> dataSource,
            List<Map<String, Object>> datatype,
            String dialectCode) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> entity : ProjectJsonSupport.allEntities(dataSource, MODULE_NAME_KEY)) {
            result.add(ProjectJsonSupport.enrichEntityFields(entity, datatype, dialectCode));
        }
        return result;
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
