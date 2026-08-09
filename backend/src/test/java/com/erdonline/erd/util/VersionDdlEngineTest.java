package com.erdonline.erd.util;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 回归：增量 DDL 必须与 changes 同源 —— N 条 entity add 产出 N 条 CREATE TABLE，
 * 不能出现「左栏 61 新增表、右栏仅 QRTZ 外键」的错位。
 */
class VersionDdlEngineTest {

    private static Map<String, Object> map(Object... kv) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            m.put((String) kv[i], kv[i + 1]);
        }
        return m;
    }

    private static Map<String, Object> mysqlDbRow(boolean defaultDb) {
        return map(
                "code", "MYSQL",
                "defaultDatabase", defaultDb,
                "createTableTemplate",
                "CREATE TABLE `{{=it.entity.title}}`(`id` INT);{{=it.separator}}");
    }

    private static Map<String, Object> entity(String title) {
        return map(
                "title", title,
                "name", "qrtz",
                "fields", new ArrayList<>(List.of(map("name", "id", "type", "String", "pk", true))));
    }

    private static Map<String, Object> qrtzModule(List<String> tableTitles, boolean withFk) {
        List<Map<String, Object>> entities = new ArrayList<>();
        for (String t : tableTitles) {
            entities.add(entity(t));
        }
        Map<String, Object> mod = new LinkedHashMap<>();
        mod.put("name", "qrtz");
        mod.put("entities", entities);
        mod.put("associations", new ArrayList<>());
        if (withFk) {
            mod.put("associations", new ArrayList<>(List.of(map(
                    "relation", "n:1",
                    "from", map("entity", "QRTZ_CRON_TRIGGERS", "field", "trigger_name"),
                    "to", map("entity", "QRTZ_TRIGGERS", "field", "trigger_name"),
                    "constraintName", "fk_cron_trigger"))));
        }
        return mod;
    }

    private static Map<String, Object> projectJson(List<String> tables, boolean withFk) {
        Map<String, Object> pgDefault = map(
                "code", "PostgreSQL",
                "defaultDatabase", true,
                "createTableTemplate", "CREATE TABLE \"{{=it.entity.title}}\"();{{=it.separator}}");
        return map(
                "profile", map("sqlConfig", "/*SQL@Run*/"),
                "dataTypeDomains", map(
                        "datatype", new ArrayList<>(List.of(
                                map("code", "String", "apply", map("MYSQL", map("type", "VARCHAR(32)"))))),
                        "database", new ArrayList<>(List.of(pgDefault, mysqlDbRow(false)))),
                "modules", new ArrayList<>(List.of(qrtzModule(tables, withFk))));
    }

    @Test
    void entityAdds_produceCreateTablePerTable_notFkOnly() {
        List<String> tables = new ArrayList<>(List.of(
                "QRTZ_BLOB_TRIGGERS", "QRTZ_CALENDARS", "QRTZ_CRON_TRIGGERS",
                "QRTZ_SIMPLE_TRIGGERS", "QRTZ_SIMPROP_TRIGGERS"));
        // 基线已有同模块（相对上一版本），association add 才会出现在 changes
        Map<String, Object> baseline = projectJson(
                new ArrayList<>(List.of("QRTZ_TRIGGERS")), false);
        Map<String, Object> current = projectJson(tables, true);

        List<Map<String, Object>> changes = VersionDiffEngine.diff(current, baseline);
        long entityAdds = changes.stream()
                .filter(c -> "entity".equals(c.get("type")) && "add".equals(c.get("opt")))
                .count();
        assertTrue(entityAdds >= 5, "expected entity adds, got changes: " + changes);
        assertTrue(changes.stream().anyMatch(c -> "association".equals(c.get("type")) && "add".equals(c.get("opt"))),
                () -> "expected association add: " + changes);

        String ddl = VersionDdlEngine.generateIncrementalSql(current, baseline, changes, "MYSQL");
        for (String t : tables) {
            assertTrue(ddl.contains("CREATE TABLE `" + t + "`"),
                    () -> "DDL must contain CREATE for " + t + ", got:\n" + ddl);
        }
        assertTrue(ddl.contains("ADD CONSTRAINT `fk_cron_trigger`"),
                () -> "association add should also emit FK, got:\n" + ddl);
        assertFalse(ddl.trim().startsWith("ALTER TABLE"),
                "must not be FK-only when entity adds exist");
    }

    @Test
    void manyEntityAdds_matchDbReverseStyle_batchCreate() {
        List<String> tables = new ArrayList<>();
        tables.add("DB_REVERSE_MYSQL");
        for (int i = 0; i < 10; i++) {
            tables.add("QRTZ_BATCH_" + i);
        }
        Map<String, Object> current = projectJson(tables, false);
        Map<String, Object> baseline = map("modules", new ArrayList<>());

        List<Map<String, Object>> changes = VersionDiffEngine.diff(current, baseline);
        String ddl = VersionDdlEngine.generateIncrementalSql(current, baseline, changes, "MYSQL");

        assertTrue(ddl.contains("CREATE TABLE `DB_REVERSE_MYSQL`"), ddl);
        for (int i = 0; i < 10; i++) {
            assertTrue(ddl.contains("CREATE TABLE `QRTZ_BATCH_" + i + "`"), ddl);
        }
    }

    @Test
    void fieldAdd_producesAlterTable() {
        Map<String, Object> table = entity("T_USER");
        table.put("fields", new ArrayList<>(List.of(
                map("name", "id", "type", "String", "pk", true),
                map("name", "REMARK", "type", "String"))));
        Map<String, Object> mod = map("name", "m1", "entities", new ArrayList<>(List.of(table)), "associations", new ArrayList<>());
        Map<String, Object> current = map(
                "profile", map("sqlConfig", "/*SQL@Run*/"),
                "dataTypeDomains", map(
                        "datatype", new ArrayList<>(List.of(
                                map("code", "String", "apply", map("MYSQL", map("type", "VARCHAR(32)"))))),
                        "database", new ArrayList<>(List.of(mysqlDbRow(true)))),
                "modules", new ArrayList<>(List.of(mod)));

        Map<String, Object> oldTable = entity("T_USER");
        Map<String, Object> oldMod = map("name", "m1", "entities", new ArrayList<>(List.of(oldTable)), "associations", new ArrayList<>());
        Map<String, Object> baseline = map("modules", new ArrayList<>(List.of(oldMod)));

        List<Map<String, Object>> changes = VersionDiffEngine.diff(current, baseline);
        String ddl = VersionDdlEngine.generateIncrementalSql(current, baseline, changes, "MYSQL");
        assertTrue(changes.stream().anyMatch(c -> "field".equals(c.get("type")) && c.get("name").toString().contains("REMARK")),
                () -> "expected field add change: " + changes);
        assertTrue(ddl.contains("ALTER TABLE `T_USER` ADD COLUMN `REMARK`"), ddl);
    }

    @Test
    void profileChanges_inDiff_butNotInDdl() {
        Map<String, Object> current = map(
                "modules", new ArrayList<>(),
                "profile", map("defaultFields", new ArrayList<>(List.of(map("name", "id", "type", "IdOrKey")))));
        Map<String, Object> baseline = map("modules", new ArrayList<>(), "profile", new HashMap<>());

        List<Map<String, Object>> changes = VersionDiffEngine.diff(current, baseline);
        assertTrue(changes.stream().anyMatch(c -> "profile".equals(c.get("type"))));

        String ddl = VersionDdlEngine.generateIncrementalSql(current, baseline, changes, "MYSQL");
        assertTrue(ddl.isBlank(), "profile-only changes must not emit SQL");
    }

    @Test
    void pickDatabaseDialect_matchesMysqlCaseInsensitive() {
        List<Map<String, Object>> dbs = new ArrayList<>(List.of(
                map("code", "PostgreSQL", "defaultDatabase", true, "createTableTemplate", "PG"),
                mysqlDbRow(false)));
        Map<String, Object> hit = VersionDdlEngine.pickDatabaseDialect(dbs, "mysql");
        assertTrue("MYSQL".equalsIgnoreCase(String.valueOf(hit.get("code"))));
    }
}
