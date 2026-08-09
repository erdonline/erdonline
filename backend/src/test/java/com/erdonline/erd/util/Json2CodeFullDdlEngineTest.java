package com.erdonline.erd.util;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Json2CodeFullDdlEngineTest {

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
                "deleteTableTemplate", "DROP TABLE `{{=it.entity.title}}`;{{=it.separator}}",
                "createTableTemplate", "CREATE TABLE `{{=it.entity.title}}`(`id` INT);{{=it.separator}}",
                "createIndexTemplate", "CREATE INDEX `{{=it.index.name}}` ON `{{=it.entity.title}}`;{{=it.separator}}",
                "updateTableComment", "COMMENT ON TABLE `{{=it.entity.title}}` IS '{{=it.entity.chnname}}';{{=it.separator}}");
    }

    private static Map<String, Object> entity(String title) {
        return map(
                "title", title,
                "chnname", title + " 注释",
                "fields", new ArrayList<>(List.of(map("name", "id", "type", "String", "pk", true))),
                "indexs", new ArrayList<>(List.of(map("name", "IDX_" + title, "fields", List.of("id")))));
    }

    private static Map<String, Object> projectJson(List<String> tables) {
        List<Map<String, Object>> entities = new ArrayList<>();
        for (String t : tables) {
            entities.add(entity(t));
        }
        Map<String, Object> mod = map("name", "m1", "entities", entities, "associations", new ArrayList<>());
        return map(
                "profile", map("sqlConfig", "/*SQL@Run*/"),
                "dataTypeDomains", map(
                        "datatype", new ArrayList<>(List.of(
                                map("code", "String", "apply", map("MYSQL", map("type", "VARCHAR(32)"))))),
                        "database", new ArrayList<>(List.of(mysqlDbRow()))),
                "modules", new ArrayList<>(List.of(mod)));
    }

    @Test
    void filterCreateTableOnly_emitsCreateNotDrop() {
        Map<String, Object> pj = projectJson(List.of("T_A", "T_B"));
        String sql = Json2CodeFullDdlEngine.generateAllSqlByFilter(
                pj, "MYSQL", List.of(DdlExportFilterKeys.CREATE_TABLE), null);
        assertTrue(sql.contains("CREATE TABLE `T_A`"), sql);
        assertTrue(sql.contains("CREATE TABLE `T_B`"), sql);
        assertFalse(sql.contains("DROP TABLE"), sql);
    }

    @Test
    void entityTitlesFilter_limitsTables() {
        Map<String, Object> pj = projectJson(List.of("T_A", "T_B"));
        String sql = Json2CodeFullDdlEngine.generateAllSqlByFilter(
                pj,
                "MYSQL",
                List.of(DdlExportFilterKeys.CREATE_TABLE),
                List.of("T_A"));
        assertTrue(sql.contains("CREATE TABLE `T_A`"), sql);
        assertFalse(sql.contains("T_B"), sql);
    }
}
