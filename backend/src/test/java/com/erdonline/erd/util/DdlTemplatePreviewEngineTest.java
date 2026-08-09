package com.erdonline.erd.util;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;

class DdlTemplatePreviewEngineTest {

    @Test
    void previewCreateTable_withDraftDotTemplate() {
        Map<String, Object> databaseRow = new LinkedHashMap<>();
        databaseRow.put("code", "MYSQL");
        databaseRow.put(
                DdlTemplateKeys.CREATE_TABLE,
                "CREATE TABLE `{{=it.entity.title}}`(`{{=it.entity.fields[0].name}}` INT);{{=it.separator}}");

        Map<String, Object> projectJson = Map.of(
                "profile", Map.of("sqlConfig", "/*SQL@Run*/"));

        String sql = DdlTemplatePreviewEngine.preview(
                projectJson, "MYSQL", DdlTemplateKeys.CREATE_TABLE, databaseRow);

        assertTrue(sql.contains("CREATE TABLE `T_SAMPLE`"), sql);
        assertTrue(sql.contains("/*SQL@Run*/"), sql);
    }

    @Test
    void previewCreateField_usesSampleFieldContext() {
        Map<String, Object> databaseRow = new LinkedHashMap<>();
        databaseRow.put("code", "MYSQL");
        databaseRow.put(
                DdlTemplateKeys.CREATE_FIELD,
                "ALTER TABLE `{{=it.entity.title}}` ADD `{{=it.field.name}}` {{=it.field.dataType}};{{=it.separator}}");

        String sql = DdlTemplatePreviewEngine.preview(
                Map.of("profile", Map.of("sqlConfig", ";")),
                "MYSQL",
                DdlTemplateKeys.CREATE_FIELD,
                databaseRow);

        assertTrue(sql.contains("T_SAMPLE"), sql);
        assertTrue(sql.contains("EMAIL"), sql);
    }

    @Test
    void buildSampleContext_rebuildTable_hasOldAndNewEntity() {
        Map<String, Object> ctx = DdlTemplatePreviewEngine.buildSampleContext(
                DdlTemplateKeys.REBUILD_TABLE, ";\n");
        assertTrue(ctx.containsKey(DdlTemplateKeys.CTX_OLD_ENTITY));
        assertTrue(ctx.containsKey(DdlTemplateKeys.CTX_NEW_ENTITY));
    }
}
