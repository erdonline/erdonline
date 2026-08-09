package com.erdonline.erd.util;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 权威增量 DDL 生成器：后端移植自前端 {@code json2code.generateUpdateSql}。
 * 由 {@link VersionDiffEngine} 产出的 changes 驱动；模板经 doT→Freemarker 适配后由 Freemarker 渲染。
 */
public final class Json2CodeDdlEngine {

    private static final String MODULE_NAME_KEY = "_moduleName";

    private Json2CodeDdlEngine() {
    }

    public static String generateUpdateSql(
            Map<String, Object> projectJson,
            List<Map<String, Object>> changesData,
            String dialectCode,
            Map<String, Object> oldProjectJson) {
        if (changesData == null || changesData.isEmpty()) {
            return "";
        }
        Map<String, Object> dataSource = projectJson != null ? projectJson : Map.of();
        Map<String, Object> oldDataSource = oldProjectJson != null ? oldProjectJson : Map.of();

        List<Map<String, Object>> datatype = ProjectJsonSupport.datatypeList(dataSource);
        Map<String, Object> database = DdlDialectSupport.pickDatabaseDialect(
                ProjectJsonSupport.databaseList(dataSource), dialectCode);
        String resolvedDialect = DdlDialectSupport.dialectCodeFromDb(database, dialectCode);
        String separator = DdlDialectSupport.sqlSeparator(dataSource);

        List<Map<String, Object>> changes = dedupeFieldUpdates(changesData);
        List<Map<String, Object>> tempEntities = enrichAllEntities(dataSource, datatype, resolvedDialect);
        List<Map<String, Object>> oldEntities = enrichAllEntities(oldDataSource, datatype, resolvedDialect);

        StringBuilder templateResult = new StringBuilder();

        appendEntityChanges(templateResult, changes, database, tempEntities, oldEntities, separator, resolvedDialect);
        templateResult.append("\r\n");

        appendIndexChanges(templateResult, changes, database, tempEntities, resolvedDialect, separator);
        templateResult.append("\r\n");

        appendFieldChanges(templateResult, changes, database, tempEntities, separator, resolvedDialect);
        templateResult.append("\r\n");

        appendAssociationChanges(templateResult, changes, dataSource, resolvedDialect, separator);
        templateResult.append("\r\n");

        return templateResult.toString();
    }

    private static void appendEntityChanges(
            StringBuilder out,
            List<Map<String, Object>> changes,
            Map<String, Object> database,
            List<Map<String, Object>> tempEntities,
            List<Map<String, Object>> oldEntities,
            String separator,
            String dialectCode) {
        for (Map<String, Object> c : changes) {
            if (!VersionDiffKeys.TYPE_ENTITY.equals(c.get(VersionDiffKeys.TYPE))) {
                continue;
            }
            String opt = ProjectJsonSupport.str(c.get(VersionDiffKeys.OPT));
            if (VersionDiffKeys.OPT_ADD.equals(opt)) {
                String tableTitle = ProjectJsonSupport.str(c.get(VersionDiffKeys.NAME));
                Map<String, Object> dataTable = ProjectJsonSupport.findEntityByTitle(tempEntities, tableTitle);
                if (dataTable == null) {
                    throw new DdlTemplateException("Entity add change references missing table: " + tableTitle);
                }
                out.append(renderTemplate(
                        DdlTemplateKeys.CREATE_TABLE,
                        database,
                        dialectCode,
                        templateContext(dataTable, separator)));
            } else if (VersionDiffKeys.OPT_REBUILD.equals(opt)) {
                String tableTitle = ProjectJsonSupport.str(c.get(VersionDiffKeys.NAME));
                Map<String, Object> dataTable = ProjectJsonSupport.findEntityByTitle(tempEntities, tableTitle);
                Map<String, Object> oldDataTable = ProjectJsonSupport.findEntityByTitle(oldEntities, tableTitle);
                if (dataTable == null || oldDataTable == null) {
                    throw new DdlTemplateException("Entity rebuild change references missing table: " + tableTitle);
                }
                Map<String, Object> ctx = new LinkedHashMap<>();
                ctx.put(DdlTemplateKeys.CTX_MODULE, Map.of(ProjectJsonKeys.NAME, moduleName(dataTable)));
                ctx.put(DdlTemplateKeys.CTX_OLD_ENTITY, oldDataTable);
                ctx.put(DdlTemplateKeys.CTX_NEW_ENTITY, dataTable);
                ctx.put(DdlTemplateKeys.CTX_SEPARATOR, separator);
                out.append(renderTemplate(DdlTemplateKeys.REBUILD_TABLE, database, dialectCode, ctx));
            } else if (VersionDiffKeys.OPT_UPDATE.equals(opt)) {
                String name = ProjectJsonSupport.str(c.get(VersionDiffKeys.NAME));
                String[] tmpChange = name.split("\\.", 2);
                if (tmpChange.length >= 2 && ProjectJsonKeys.CHNNAME.equals(tmpChange[1])) {
                    String[] changeData = ProjectJsonSupport.str(c.get(VersionDiffKeys.CHANGE_DATA)).split("=>", 2);
                    String newChn = changeData.length > 1 ? changeData[1] : "";
                    Map<String, Object> ctx = new LinkedHashMap<>();
                    ctx.put(DdlTemplateKeys.CTX_ENTITY, Map.of(
                            ProjectJsonKeys.TITLE, tmpChange[0],
                            ProjectJsonKeys.CHNNAME, newChn));
                    ctx.put(DdlTemplateKeys.CTX_SEPARATOR, separator);
                    out.append(renderTemplate(DdlTemplateKeys.UPDATE_TABLE_COMMENT, database, dialectCode, ctx));
                }
            } else {
                String tableTitle = ProjectJsonSupport.str(c.get(VersionDiffKeys.NAME));
                Map<String, Object> ctx = new LinkedHashMap<>();
                ctx.put(DdlTemplateKeys.CTX_ENTITY, Map.of(ProjectJsonKeys.TITLE, tableTitle));
                ctx.put(DdlTemplateKeys.CTX_SEPARATOR, separator);
                out.append(renderTemplate(DdlTemplateKeys.DELETE_TABLE, database, dialectCode, ctx));
            }
        }
    }

    private static void appendIndexChanges(
            StringBuilder out,
            List<Map<String, Object>> changes,
            Map<String, Object> database,
            List<Map<String, Object>> tempEntities,
            String dialectCode,
            String separator) {
        for (Map<String, Object> c : changes) {
            if (!VersionDiffKeys.TYPE_INDEX.equals(c.get(VersionDiffKeys.TYPE))) {
                continue;
            }
            String[] parts = ProjectJsonSupport.str(c.get(VersionDiffKeys.NAME)).split("\\.", 2);
            if (parts.length < 2) {
                continue;
            }
            String tableTitle = parts[0];
            String indexName = parts[1];
            Map<String, Object> dataTable = ProjectJsonSupport.findEntityByTitle(tempEntities, tableTitle);
            if (dataTable == null) {
                continue;
            }
            Map<String, Object> index = ProjectJsonSupport.findIndexByName(dataTable, indexName);
            if (index == null) {
                index = Map.of(ProjectJsonKeys.NAME, indexName);
            }
            Map<String, Object> ctx = templateContext(dataTable, separator);
            ctx.put(DdlTemplateKeys.CTX_INDEX, index);

            String opt = ProjectJsonSupport.str(c.get(VersionDiffKeys.OPT));
            if (VersionDiffKeys.OPT_ADD.equals(opt)) {
                out.append(DdlIndexRenderer.renderCreateIndexSql(
                        templateText(DdlTemplateKeys.CREATE_INDEX, database),
                        ctx,
                        dialectCode));
            } else if (VersionDiffKeys.OPT_UPDATE.equals(opt)) {
                String deleteString = DdlTemplateRenderer.render(
                        DdlTemplateKeys.DELETE_INDEX, dialectCode, database, ctx);
                String createString = DdlTemplateRenderer.render(
                        DdlTemplateKeys.CREATE_INDEX, dialectCode, database, ctx);
                out.append(deleteString).append(separator).append("\n").append(createString);
            } else {
                out.append(DdlTemplateRenderer.render(DdlTemplateKeys.DELETE_INDEX, dialectCode, database, ctx));
            }
        }
    }

    private static void appendFieldChanges(
            StringBuilder out,
            List<Map<String, Object>> changes,
            Map<String, Object> database,
            List<Map<String, Object>> tempEntities,
            String separator,
            String dialectCode) {
        for (Map<String, Object> c : changes) {
            if (!VersionDiffKeys.TYPE_FIELD.equals(c.get(VersionDiffKeys.TYPE))) {
                continue;
            }
            String[] parts = ProjectJsonSupport.str(c.get(VersionDiffKeys.NAME)).split("\\.");
            if (parts.length < 2) {
                continue;
            }
            String tableTitle = parts[0];
            String fieldName = parts[1];
            Map<String, Object> dataTable = ProjectJsonSupport.findEntityByTitle(tempEntities, tableTitle);
            if (dataTable == null) {
                continue;
            }
            String opt = ProjectJsonSupport.str(c.get(VersionDiffKeys.OPT));
            if (VersionDiffKeys.OPT_UPDATE.equals(opt)) {
                Map<String, Object> field = ProjectJsonSupport.findFieldByName(dataTable, fieldName);
                if (field == null) {
                    continue;
                }
                String[] changeData = ProjectJsonSupport.str(c.get(VersionDiffKeys.CHANGE_DATA)).split("=>", 2);
                Map<String, Object> fieldCtx = fieldContext(field, parts, changeData);
                Map<String, Object> ctx = templateContext(dataTable, separator);
                ctx.put(DdlTemplateKeys.CTX_FIELD, fieldCtx);

                if (parts.length >= 3 && "pk".equals(parts[parts.length - 1])) {
                    String newVal = changeData.length > 1 ? changeData[1] : "";
                    if ("true".equals(newVal)) {
                        out.append(renderTemplate(DdlTemplateKeys.CREATE_PK, database, dialectCode, ctx));
                    } else if ("false".equals(newVal)) {
                        out.append(renderTemplate(DdlTemplateKeys.DELETE_PK, database, dialectCode, ctx));
                    }
                    continue;
                }
                out.append(renderTemplate(DdlTemplateKeys.UPDATE_FIELD, database, dialectCode, ctx));
            } else if (VersionDiffKeys.OPT_ADD.equals(opt)) {
                Map<String, Object> field = ProjectJsonSupport.findFieldByName(dataTable, fieldName);
                if (field == null) {
                    continue;
                }
                Map<String, Object> fieldCtx = new LinkedHashMap<>(field);
                List<Map<String, Object>> fields = ProjectJsonSupport.asMapList(dataTable.get(ProjectJsonKeys.FIELDS));
                int position = -1;
                for (int i = 0; i < fields.size(); i++) {
                    if (ProjectJsonSupport.str(fields.get(i).get(ProjectJsonKeys.NAME)).equals(fieldName)) {
                        position = i;
                        break;
                    }
                }
                if (position > 0) {
                    fieldCtx.put("addAfter", ProjectJsonSupport.str(fields.get(position - 1).get(ProjectJsonKeys.NAME)));
                }
                Map<String, Object> ctx = templateContext(dataTable, separator);
                ctx.put(DdlTemplateKeys.CTX_FIELD, fieldCtx);
                out.append(renderTemplate(DdlTemplateKeys.CREATE_FIELD, database, dialectCode, ctx));
            } else {
                Map<String, Object> ctx = templateContext(dataTable, separator);
                ctx.put(DdlTemplateKeys.CTX_FIELD, Map.of(ProjectJsonKeys.NAME, fieldName));
                out.append(renderTemplate(DdlTemplateKeys.DELETE_FIELD, database, dialectCode, ctx));
            }
        }
    }

    private static void appendAssociationChanges(
            StringBuilder out,
            List<Map<String, Object>> changes,
            Map<String, Object> dataSource,
            String dialectCode,
            String separator) {
        for (Map<String, Object> c : changes) {
            if (!VersionDiffKeys.TYPE_ASSOCIATION.equals(c.get(VersionDiffKeys.TYPE))
                    || !VersionDiffKeys.OPT_ADD.equals(c.get(VersionDiffKeys.OPT))) {
                continue;
            }
            Map<String, Object> assoc = DdlForeignKeyRenderer.findAssociationByChangeName(
                    dataSource, ProjectJsonSupport.str(c.get(VersionDiffKeys.NAME)));
            if (assoc == null) {
                continue;
            }
            for (DdlForeignKeyRenderer.ForeignKeyGroup g : DdlForeignKeyRenderer.groupAssociationsForFk(List.of(assoc))) {
                out.append(DdlForeignKeyRenderer.renderCreateForeignKeySql(g, separator, dialectCode));
            }
        }
    }

    private static Map<String, Object> templateContext(Map<String, Object> dataTable, String separator) {
        Map<String, Object> ctx = new LinkedHashMap<>();
        ctx.put(DdlTemplateKeys.CTX_MODULE, Map.of(ProjectJsonKeys.NAME, moduleName(dataTable)));
        ctx.put(DdlTemplateKeys.CTX_ENTITY, dataTable);
        ctx.put(DdlTemplateKeys.CTX_SEPARATOR, separator);
        return ctx;
    }

    private static Map<String, Object> fieldContext(
            Map<String, Object> field,
            String[] nameParts,
            String[] changeData) {
        Map<String, Object> fieldCtx = new LinkedHashMap<>(field);
        if (nameParts.length >= 3) {
            fieldCtx.put("updateName", nameParts[2]);
        }
        if (changeData.length > 1) {
            fieldCtx.put("update", changeData[1]);
        }
        return fieldCtx;
    }

    private static String renderTemplate(
            String templateKey,
            Map<String, Object> database,
            String dialectCode,
            Map<String, Object> ctx) {
        return DdlTemplateRenderer.render(templateKey, dialectCode, database, ctx);
    }

    private static String templateText(String templateKey, Map<String, Object> database) {
        if (database == null) {
            return "";
        }
        Object tpl = database.get(templateKey);
        return tpl != null ? String.valueOf(tpl) : "";
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

    private static List<Map<String, Object>> dedupeFieldUpdates(List<Map<String, Object>> changes) {
        Set<String> seen = new HashSet<>();
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> c : changes) {
            if (VersionDiffKeys.TYPE_FIELD.equals(c.get(VersionDiffKeys.TYPE))
                    && VersionDiffKeys.OPT_UPDATE.equals(c.get(VersionDiffKeys.OPT))) {
                String name = ProjectJsonSupport.str(c.get(VersionDiffKeys.NAME));
                String[] parts = name.split("\\.");
                if (parts.length >= 2) {
                    String key = parts[0] + parts[1];
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

    private static String moduleName(Map<String, Object> entity) {
        Object m = entity.get(MODULE_NAME_KEY);
        return m != null ? String.valueOf(m) : "";
    }
}
