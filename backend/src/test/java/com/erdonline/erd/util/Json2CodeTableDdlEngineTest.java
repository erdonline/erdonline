package com.erdonline.erd.util;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;

class Json2CodeTableDdlEngineTest {

    private static Map<String, Object> map(Object... kv) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            m.put((String) kv[i], kv[i + 1]);
        }
        return m;
    }

    private static Map<String, Object> mysqlDbRow() {
        return map(
                "code", "MYSQL",
                "defaultDatabase", true,
                "createTableTemplate", "CREATE TABLE `{{=it.entity.title}}`(`id` INT);{{=it.separator}}",
                "createFieldTemplate",
                "ALTER TABLE `{{=it.entity.title}}` ADD COLUMN `{{=it.field.name}}` {{=it.field.type}};{{=it.separator}}");
    }

    @Test
    void createTableTemplate_emitsSingleTableDdl() {
        Map<String, Object> table = map(
                "title", "T_USER",
                "fields", new ArrayList<>(List.of(map("name", "id", "type", "String", "pk", true))));
        Map<String, Object> mod = map("name", "m1", "entities", new ArrayList<>(List.of(table)), "associations", new ArrayList<>());
        Map<String, Object> pj = map(
                "profile", map("sqlConfig", "/*SQL@Run*/"),
                "dataTypeDomains", map(
                        "datatype", new ArrayList<>(List.of(
                                map("code", "String", "apply", map("MYSQL", map("type", "VARCHAR(32)"))))),
                        "database", new ArrayList<>(List.of(mysqlDbRow()))),
                "modules", new ArrayList<>(List.of(mod)));

        String sql = Json2CodeTableDdlEngine.generateTableSql(
                pj, "m1", table, "MYSQL", DdlTemplateKeys.CREATE_TABLE, List.of(), Map.of());
        assertTrue(sql.contains("CREATE TABLE `T_USER`"), sql);
    }

    @Test
    void fieldAddChange_emitsAlterTable() {
        Map<String, Object> table = map(
                "title", "T_USER",
                "fields", new ArrayList<>(List.of(
                        map("name", "id", "type", "String", "pk", true),
                        map("name", "REMARK", "type", "String"))));
        Map<String, Object> oldTable = map(
                "title", "T_USER",
                "fields", new ArrayList<>(List.of(map("name", "id", "type", "String", "pk", true))));
        Map<String, Object> mod = map("name", "m1", "entities", new ArrayList<>(List.of(table)), "associations", new ArrayList<>());
        Map<String, Object> oldMod = map("name", "m1", "entities", new ArrayList<>(List.of(oldTable)), "associations", new ArrayList<>());
        Map<String, Object> current = map(
                "profile", map("sqlConfig", "/*SQL@Run*/"),
                "dataTypeDomains", map(
                        "datatype", new ArrayList<>(List.of(
                                map("code", "String", "apply", map("MYSQL", map("type", "VARCHAR(32)"))))),
                        "database", new ArrayList<>(List.of(mysqlDbRow()))),
                "modules", new ArrayList<>(List.of(mod)));
        Map<String, Object> baseline = map("modules", new ArrayList<>(List.of(oldMod)));

        List<Map<String, Object>> changes = List.of(map(
                "type", "field",
                "opt", "add",
                "name", "T_USER.REMARK"));

        String sql = Json2CodeTableDdlEngine.generateTableSql(
                current, "m1", table, "MYSQL", DdlTemplateKeys.CREATE_FIELD, changes, baseline);
        assertTrue(sql.contains("ALTER TABLE `T_USER` ADD COLUMN `REMARK`"), sql);
    }
}
