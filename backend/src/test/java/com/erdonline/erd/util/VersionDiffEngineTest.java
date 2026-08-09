package com.erdonline.erd.util;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 与 {@code frontend/src/utils/versionStructuralDiff.test.ts} 逐条对齐的用例，
 * 确保前后端「所见即真差异」算法结果一致。
 */
class VersionDiffEngineTest {

    private static Map<String, Object> map(Object... kv) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) {
            m.put((String) kv[i], kv[i + 1]);
        }
        return m;
    }

    private static Map<String, Object> baseTable() {
        return map(
                "title", "T_USER",
                "fields", new ArrayList<>(List.of(map("name", "id", "type", "IdOrKey", "pk", true))),
                "indexs", new ArrayList<>()
        );
    }

    private static Map<String, Object> baseModule() {
        Map<String, Object> mod = new LinkedHashMap<>();
        mod.put("name", "M1");
        mod.put("entities", new ArrayList<>(List.of(baseTable())));
        mod.put("associations", new ArrayList<>());
        mod.put("diagrams", new ArrayList<>(List.of(map(
                "id", "d1", "name", "主图",
                "layout", map("nodes", new ArrayList<>(List.of(map("id", "T_USER", "x", 0, "y", 0))))
        ))));
        return mod;
    }

    @Test
    void identicalProjectJSON_isNotMeaningful() {
        Map<String, Object> pj = map("modules", new ArrayList<>(List.of(baseModule())));
        List<Map<String, Object>> changes = VersionDiffEngine.diff(pj, pj);
        assertTrue(changes.isEmpty(), () -> "expected no changes, got: " + changes);
    }

    /**
     * 回归：entity.triggers 等数组字段在两次反序列化后内容相同但引用不同，
     * 用内容判等（Map/List.equals）不得误判为「有差异」。
     */
    @Test
    void emptyArrayFieldWithDifferentReference_isNotDiff() {
        Map<String, Object> current = new LinkedHashMap<>(baseTable());
        current.put("triggers", new ArrayList<>());
        Map<String, Object> baseline = new LinkedHashMap<>(baseTable());
        baseline.put("triggers", new ArrayList<>());

        Map<String, Object> mod = new LinkedHashMap<>();
        mod.put("name", "M1");
        mod.put("entities", new ArrayList<>(List.of(current)));

        Map<String, Object> baseMod = new LinkedHashMap<>();
        baseMod.put("name", "M1");
        baseMod.put("entities", new ArrayList<>(List.of(baseline)));

        Map<String, Object> curPj = map("modules", new ArrayList<>(List.of(mod)));
        Map<String, Object> basePj = map("modules", new ArrayList<>(List.of(baseMod)));

        List<Map<String, Object>> changes = VersionDiffEngine.diff(curPj, basePj);
        assertTrue(changes.isEmpty(), () -> "expected no diff for content-equal empty arrays, got: " + changes);
    }

    @Test
    void associationAdd_isDetected() {
        Map<String, Object> mod = baseModule();
        mod.put("associations", new ArrayList<>(List.of(map(
                "relation", "1:n",
                "from", map("entity", "T_ORDER", "field", "USER_ID"),
                "to", map("entity", "T_USER", "field", "id")
        ))));

        Map<String, Object> current = map("modules", new ArrayList<>(List.of(mod)));
        Map<String, Object> baseline = map("modules", new ArrayList<>(List.of(baseModule())));

        List<Map<String, Object>> changes = VersionDiffEngine.diff(current, baseline);
        boolean found = changes.stream().anyMatch(c -> "association".equals(c.get("type")) && "add".equals(c.get("opt")));
        assertTrue(found, () -> "expected association add, got: " + changes);
    }

    @Test
    void diagramLayoutChange_isDetected() {
        Map<String, Object> mod = baseModule();
        mod.put("diagrams", new ArrayList<>(List.of(map(
                "id", "d1", "name", "主图",
                "layout", map("nodes", new ArrayList<>(List.of(map("id", "T_USER", "x", 100, "y", 0))))
        ))));

        Map<String, Object> current = map("modules", new ArrayList<>(List.of(mod)));
        Map<String, Object> baseline = map("modules", new ArrayList<>(List.of(baseModule())));

        List<Map<String, Object>> changes = VersionDiffEngine.diff(current, baseline);
        boolean found = changes.stream().anyMatch(c ->
                "diagram".equals(c.get("type")) && "update".equals(c.get("opt"))
                        && String.valueOf(c.get("name")).endsWith(".layout"));
        assertTrue(found, () -> "expected diagram layout update, got: " + changes);
    }

    @Test
    void profileChange_isDetected() {
        Map<String, Object> baseProfile = map(
                "defaultFields", new ArrayList<>(List.of(map("name", "id", "type", "IdOrKey"))),
                "tableLimit", 200
        );
        Map<String, Object> curProfile = map(
                "defaultFields", new ArrayList<>(List.of(map("name", "e2e_pk", "type", "IdOrKey")))
        );

        Map<String, Object> current = map("modules", new ArrayList<>(List.of(baseModule())), "profile", curProfile);
        Map<String, Object> baseline = map("modules", new ArrayList<>(List.of(baseModule())), "profile", baseProfile);

        List<Map<String, Object>> changes = VersionDiffEngine.diff(current, baseline);
        boolean found = changes.stream().anyMatch(c -> "profile".equals(c.get("type")) && "defaultFields".equals(c.get("name")));
        assertTrue(found, () -> "expected profile defaultFields change, got: " + changes);
    }

    @Test
    void dataTypeDomainChange_isDetected() {
        Map<String, Object> baseDomains = map(
                "datatype", new ArrayList<>(List.of(map("code", "IdOrKey", "name", "主键",
                        "apply", map("MYSQL", map("type", "bigint"))))),
                "database", new ArrayList<>(List.of(map("code", "MYSQL")))
        );
        Map<String, Object> curDomains = map(
                "datatype", new ArrayList<>(List.of(map("code", "IdOrKey", "name", "主键",
                        "apply", map("MYSQL", map("type", "int"))))),
                "database", new ArrayList<>(List.of(map("code", "MYSQL")))
        );

        Map<String, Object> current = map("modules", new ArrayList<>(), "dataTypeDomains", curDomains);
        Map<String, Object> baseline = map("modules", new ArrayList<>(), "dataTypeDomains", baseDomains);

        List<Map<String, Object>> changes = VersionDiffEngine.diff(current, baseline);
        boolean found = changes.stream().anyMatch(c ->
                "datatype".equals(c.get("type")) && "datatype.IdOrKey".equals(c.get("name")) && "update".equals(c.get("opt")));
        assertTrue(found, () -> "expected datatype update, got: " + changes);
    }

    @Test
    void noBaseline_diffsAgainstEmptyModel_everythingIsAdd() {
        Map<String, Object> current = map("modules", new ArrayList<>(List.of(baseModule())));
        List<Map<String, Object>> changes = VersionDiffEngine.diff(current, new HashMap<>());
        boolean found = changes.stream().anyMatch(c -> "entity".equals(c.get("type")) && "add".equals(c.get("opt")));
        assertTrue(found, () -> "expected entity add against empty baseline, got: " + changes);
    }

    @Test
    void nullInputs_doNotThrow() {
        List<Map<String, Object>> changes = VersionDiffEngine.diff(null, null);
        assertTrue(changes.isEmpty());
    }
}
