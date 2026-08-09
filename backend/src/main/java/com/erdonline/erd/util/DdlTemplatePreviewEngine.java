package com.erdonline.erd.util;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * DDL 模板编辑器预览：用样例实体上下文渲染当前草稿模板（Freemarker / doT 桥接）。
 */
public final class DdlTemplatePreviewEngine {

    private DdlTemplatePreviewEngine() {
    }

    public static String preview(
            Map<String, Object> projectJson,
            String dialectCode,
            String templateKey,
            Map<String, Object> databaseRowDraft) {
        if (templateKey == null || templateKey.isBlank()) {
            return "";
        }
        Map<String, Object> database = databaseRowDraft != null
                ? new LinkedHashMap<>(databaseRowDraft)
                : new LinkedHashMap<>();
        if (dialectCode != null && !dialectCode.isBlank()) {
            database.putIfAbsent(ProjectJsonKeys.CODE, dialectCode);
        }
        String resolvedDialect = DdlDialectSupport.dialectCodeFromDb(database, dialectCode);
        String separator = projectJson != null && !projectJson.isEmpty()
                ? DdlDialectSupport.sqlSeparator(projectJson)
                : DdlTemplateKeys.DEFAULT_SQL_SEPARATOR + "\n";

        Map<String, Object> ctx = buildSampleContext(templateKey, separator);

        if (DdlTemplateKeys.CREATE_INDEX.equals(templateKey)) {
            String tpl = templateText(database, templateKey);
            if (tpl.isBlank()) {
                tpl = DdlTemplateRenderer.resolveFtlSource(templateKey, resolvedDialect, database);
            }
            return DdlIndexRenderer.renderCreateIndexSql(tpl, ctx, resolvedDialect);
        }

        String custom = templateText(database, templateKey);
        if (!custom.isBlank()) {
            return DdlTemplateRenderer.renderInline(custom, database, ctx);
        }
        return DdlTemplateRenderer.render(templateKey, resolvedDialect, database, ctx);
    }

    private static String templateText(Map<String, Object> database, String templateKey) {
        Object tpl = database.get(templateKey);
        return tpl != null ? String.valueOf(tpl) : "";
    }

    static Map<String, Object> buildSampleContext(String templateKey, String separator) {
        Map<String, Object> entity = sampleEntity();
        Map<String, Object> ctx = new LinkedHashMap<>();
        ctx.put(DdlTemplateKeys.CTX_MODULE, Map.of(ProjectJsonKeys.NAME, "demo"));
        ctx.put(DdlTemplateKeys.CTX_SEPARATOR, separator);

        if (DdlTemplateKeys.REBUILD_TABLE.equals(templateKey)) {
            Map<String, Object> oldEntity = sampleEntity();
            Map<String, Object> newEntity = sampleEntityRenamed();
            ctx.put(DdlTemplateKeys.CTX_OLD_ENTITY, oldEntity);
            ctx.put(DdlTemplateKeys.CTX_NEW_ENTITY, newEntity);
            return ctx;
        }

        ctx.put(DdlTemplateKeys.CTX_ENTITY, entity);

        if (DdlTemplateKeys.CREATE_FIELD.equals(templateKey)
                || DdlTemplateKeys.UPDATE_FIELD.equals(templateKey)
                || DdlTemplateKeys.DELETE_FIELD.equals(templateKey)
                || DdlTemplateKeys.CREATE_PK.equals(templateKey)
                || DdlTemplateKeys.DELETE_PK.equals(templateKey)) {
            Map<String, Object> field = sampleField();
            ctx.put(DdlTemplateKeys.CTX_FIELD, field);
        }

        if (DdlTemplateKeys.CREATE_INDEX.equals(templateKey)
                || DdlTemplateKeys.DELETE_INDEX.equals(templateKey)) {
            ctx.put(DdlTemplateKeys.CTX_INDEX, sampleIndex());
        }

        return ctx;
    }

    private static Map<String, Object> sampleEntity() {
        List<Map<String, Object>> fields = new ArrayList<>();
        fields.add(field("ID", "VARCHAR(32)", true, true, true, "主键", ""));
        fields.add(field("NAME", "VARCHAR(64)", false, true, false, "名称", ""));

        Map<String, Object> entity = new LinkedHashMap<>();
        entity.put(ProjectJsonKeys.TITLE, "T_SAMPLE");
        entity.put("chnname", "示例表");
        entity.put("remark", "DDL 模板预览");
        entity.put(ProjectJsonKeys.FIELDS, fields);
        entity.put(ProjectJsonKeys.INDEXS, List.of(sampleIndex()));
        return entity;
    }

    private static Map<String, Object> sampleEntityRenamed() {
        Map<String, Object> entity = sampleEntity();
        entity.put(ProjectJsonKeys.TITLE, "T_SAMPLE_V2");
        entity.put("chnname", "示例表（新）");
        List<Map<String, Object>> fields = new ArrayList<>(ProjectJsonSupport.asMapList(entity.get(ProjectJsonKeys.FIELDS)));
        fields.add(field("STATUS", "TINYINT", false, false, false, "状态", ""));
        entity.put(ProjectJsonKeys.FIELDS, fields);
        return entity;
    }

    private static Map<String, Object> sampleField() {
        Map<String, Object> field = field("EMAIL", "VARCHAR(128)", false, true, false, "邮箱", "");
        field.put("addAfter", "NAME");
        return field;
    }

    private static Map<String, Object> sampleIndex() {
        Map<String, Object> index = new LinkedHashMap<>();
        index.put(ProjectJsonKeys.NAME, "IDX_SAMPLE_NAME");
        index.put("isUnique", false);
        index.put("fields", List.of("NAME"));
        index.put("filter", "");
        return index;
    }

    private static Map<String, Object> field(
            String name,
            String dataType,
            boolean pk,
            boolean notNull,
            boolean autoIncrement,
            String chnname,
            String remark) {
        Map<String, Object> f = new LinkedHashMap<>();
        f.put(ProjectJsonKeys.NAME, name);
        f.put(ProjectJsonKeys.TYPE, "String");
        f.put("dataType", dataType);
        f.put("pk", pk);
        f.put("notNull", notNull);
        f.put("autoIncrement", autoIncrement);
        f.put("chnname", chnname);
        f.put("remark", remark);
        return f;
    }
}
