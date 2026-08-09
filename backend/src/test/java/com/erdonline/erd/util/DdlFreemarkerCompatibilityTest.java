package com.erdonline.erd.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 证明 doT→Freemarker 兼容层可渲染 defaultData 真实 createTableTemplate（含字段循环 + PK）。
 */
class DdlFreemarkerCompatibilityTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Test
    void defaultDataMysqlCreateTableTemplate_rendersFieldsAndPk() throws Exception {
        Path defaultData = Path.of("../frontend/src/utils/defaultData.json").normalize();
        JsonNode root = MAPPER.readTree(Files.readString(defaultData));
        String dotTemplate = null;
        for (JsonNode db : root.path("dataTypeDomains").path("database")) {
            if ("MYSQL".equals(db.path("code").asText())) {
                dotTemplate = db.path("createTableTemplate").asText();
                break;
            }
        }
        assertTrue(dotTemplate != null && !dotTemplate.isBlank(), "MYSQL createTableTemplate missing");

        Map<String, Object> entity = new LinkedHashMap<>();
        entity.put("title", "T_USER");
        entity.put("chnname", "用户");
        entity.put("remark", "");
        entity.put("fields", List.of(
                Map.of("name", "ID", "dataType", "VARCHAR(32)", "pk", true, "notNull", true,
                        "autoIncrement", true, "chnname", "主键", "remark", ""),
                Map.of("name", "NAME", "dataType", "VARCHAR(64)", "pk", false, "notNull", true,
                        "chnname", "姓名", "remark", "")));

        Map<String, Object> ctx = Map.of(
                DdlTemplateKeys.CTX_ENTITY, entity,
                DdlTemplateKeys.CTX_MODULE, Map.of("name", "demo"),
                DdlTemplateKeys.CTX_SEPARATOR, "/*SQL@Run*/\n");

        String sql = DdlTemplateRenderer.renderInline(dotTemplate, ctx);

        assertTrue(sql.contains("CREATE TABLE `T_USER`"), sql);
        assertTrue(sql.contains("`ID` VARCHAR(32)"), sql);
        assertTrue(sql.contains("NOT NULL"), sql);
        assertTrue(sql.contains("AUTO_INCREMENT"), sql);
        assertTrue(sql.contains("`NAME` VARCHAR(64)"), sql);
        assertTrue(sql.contains("PRIMARY KEY"), sql);
        assertTrue(sql.contains("`ID`"), sql);
        assertTrue(sql.contains("/*SQL@Run*/"), sql);
    }

    @Test
    void classpathMysqlCreateTableTemplate_rendersWithoutDot() {
        Map<String, Object> entity = new LinkedHashMap<>();
        entity.put("title", "T_ORDER");
        entity.put("chnname", "订单");
        entity.put("fields", List.of(
                Map.of("name", "ID", "dataType", "BIGINT", "pk", true, "notNull", true),
                Map.of("name", "AMT", "dataType", "DECIMAL(18,2)", "chnname", "金额")));

        Map<String, Object> ctx = Map.of(
                DdlTemplateKeys.CTX_ENTITY, entity,
                DdlTemplateKeys.CTX_SEPARATOR, ";\n");

        String sql = DdlTemplateRenderer.render(
                DdlTemplateKeys.CREATE_TABLE, "MYSQL", Map.of(), ctx);

        assertTrue(sql.contains("CREATE TABLE `T_ORDER`"), sql);
        assertTrue(sql.contains("PRIMARY KEY (`ID`)"), sql);
        assertTrue(sql.contains("`AMT` DECIMAL(18,2)"), sql);
    }

    @Test
    void dotToFreemarkerTranslator_preservesJoinSpreadForIndex() {
        String dot = "ALTER TABLE `{{=it.entity.title}}` ADD INDEX `{{=it.index.name}}`({{=it.func.join(...it.index.fields,',')}});";
        String ftl = DotToFreemarkerTranslator.translate(dot);
        assertTrue(ftl.contains("erdJoin"), ftl);

        Map<String, Object> ctx = Map.of(
                DdlTemplateKeys.CTX_ENTITY, Map.of("title", "T_X"),
                DdlTemplateKeys.CTX_INDEX, Map.of("name", "idx_a", "fields", List.of("A", "B")),
                DdlTemplateKeys.CTX_SEPARATOR, ";\n");
        String sql = DdlTemplateRenderer.renderInline(ftl, ctx);
        assertTrue(sql.contains("idx_a"), sql);
        assertTrue(sql.contains("A,B") || sql.contains("A, B"), sql);
    }

    @Test
    void customCreateTableTemplate_overridesClasspathSeed() {
        Map<String, Object> entity = new LinkedHashMap<>();
        entity.put("title", "T_CUSTOM");
        entity.put("chnname", "自定义");
        entity.put("fields", List.of(
                Map.of("name", "ID", "dataType", "INT", "pk", true, "notNull", true)));

        Map<String, Object> ctx = Map.of(
                DdlTemplateKeys.CTX_ENTITY, entity,
                DdlTemplateKeys.CTX_SEPARATOR, ";\n");

        Map<String, Object> databaseRow = Map.of(
                DdlTemplateKeys.CREATE_TABLE,
                "CREATE TABLE __CUSTOM__`${entity.title}`(`id` INT);${separator}");

        String sql = DdlTemplateRenderer.render(
                DdlTemplateKeys.CREATE_TABLE, "MYSQL", databaseRow, ctx);

        assertTrue(sql.contains("__CUSTOM__`T_CUSTOM`"), sql);
        assertTrue(!sql.contains("COMMENT ="), "custom template must win over classpath seed");
    }

    @Test
    void classpathSeeds_postgresqlAndOracle_matchMysqlTemplateKeys() {
        List<String> keys = List.of(
                DdlTemplateKeys.CREATE_TABLE,
                DdlTemplateKeys.DELETE_TABLE,
                DdlTemplateKeys.REBUILD_TABLE,
                DdlTemplateKeys.CREATE_FIELD,
                DdlTemplateKeys.UPDATE_FIELD,
                DdlTemplateKeys.DELETE_FIELD,
                DdlTemplateKeys.CREATE_PK,
                DdlTemplateKeys.DELETE_PK,
                DdlTemplateKeys.CREATE_INDEX,
                DdlTemplateKeys.DELETE_INDEX,
                DdlTemplateKeys.UPDATE_TABLE_COMMENT);
        for (String dialect : List.of("postgresql", "oracle")) {
            for (String key : keys) {
                assertTrue(
                        DdlFreemarkerTemplateEngine.classpathTemplateExists(dialect, key),
                        dialect + " missing " + key);
            }
        }
    }
}
