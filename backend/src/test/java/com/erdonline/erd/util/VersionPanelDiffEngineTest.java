package com.erdonline.erd.util;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VersionPanelDiffEngineTest {

    private static Map<String, Object> map(Object... kv) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            m.put((String) kv[i], kv[i + 1]);
        }
        return m;
    }

    @Test
    void compute_returnsAlignedChangesAndDdl() {
        Map<String, Object> entity = map(
                "title", "T_ORDER",
                "fields", new ArrayList<>(List.of(map("name", "id", "type", "String", "pk", true))));
        Map<String, Object> mod = map(
                "name", "shop",
                "entities", new ArrayList<>(List.of(entity)),
                "associations", new ArrayList<>());
        Map<String, Object> current = map(
                "profile", map("sqlConfig", "/*SQL@Run*/"),
                "dataTypeDomains", map(
                        "datatype", new ArrayList<>(List.of(
                                map("code", "String", "apply", map("MYSQL", map("type", "VARCHAR(32)"))))),
                        "database", new ArrayList<>(List.of(map(
                                "code", "MYSQL",
                                "defaultDatabase", true,
                                "createTableTemplate", "CREATE TABLE `{{=it.entity.title}}`();{{=it.separator}}")))),
                "modules", new ArrayList<>(List.of(mod)));

        Map<String, Object> panel = VersionPanelDiffEngine.compute(current, Map.of(), "MYSQL");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> changes = (List<Map<String, Object>>) panel.get("changes");
        String ddl = String.valueOf(panel.get("ddl"));

        assertFalse(changes.isEmpty());
        assertTrue(changes.stream().anyMatch(c -> "entity".equals(c.get("type")) && "add".equals(c.get("opt"))));
        assertTrue(ddl.contains("CREATE TABLE `T_ORDER`"),
                () -> "ddl must reflect entity add from same diff, got: " + ddl);

        long entityAdds = changes.stream()
                .filter(c -> "entity".equals(c.get("type")) && "add".equals(c.get("opt")))
                .count();
        long createCount = ddl.split("CREATE TABLE").length - 1;
        assertEquals(entityAdds, createCount,
                () -> "CREATE TABLE count must match entity add count; ddl=\n" + ddl);
    }
}
