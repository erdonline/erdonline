package com.erdonline.erd.util;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SqlServerClasspathTemplatesTest {

    @Test
    void sqlServerHasAllElevenClasspathTemplates() {
        Map<String, String> sources = DdlFreemarkerTemplateEngine.loadAllClasspathSources("SQLServer");
        assertEquals(11, sources.size(), "SQL Server should ship all 11 Freemarker keys");
        assertTrue(sources.containsKey(DdlTemplateKeys.CREATE_TABLE));
        assertTrue(sources.get(DdlTemplateKeys.CREATE_TABLE).contains("CREATE TABLE"));
        assertTrue(sources.get(DdlTemplateKeys.CREATE_TABLE).contains("IDENTITY"));
    }

    @Test
    void sqlServerCreateTableTemplate_rendersSampleEntity() {
        Map<String, Object> entity = Map.of(
                "title", "T_ORDER",
                "chnname", "订单",
                "fields", java.util.List.of(
                        Map.of("name", "ID", "dataType", "BIGINT", "pk", true, "notNull", true,
                                "autoIncrement", true, "chnname", "主键"),
                        Map.of("name", "AMT", "dataType", "DECIMAL(18,2)", "chnname", "金额")));
        Map<String, Object> ctx = Map.of(
                DdlTemplateKeys.CTX_ENTITY, entity,
                DdlTemplateKeys.CTX_SEPARATOR, ";\n");

        String sql = DdlTemplateRenderer.render(
                DdlTemplateKeys.CREATE_TABLE, "SQLServer", Map.of(), ctx);

        assertTrue(sql.contains("CREATE TABLE [T_ORDER]"), sql);
        assertTrue(sql.contains("IDENTITY(1,1)"), sql);
        assertTrue(sql.contains("CONSTRAINT PK_T_ORDER PRIMARY KEY ([ID])"), sql);
    }
}
