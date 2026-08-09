package com.erdonline.erd.util;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * A 层全量 structural diff：后端权威实现，与
 * {@code frontend/src/utils/versionStructuralDiff.ts} 逐条对齐（ADR-0022 后续切片：
 * 「所见即真差异」由后端统一计算，前端只展示）。
 *
 * <p>输入为 Jackson 反序列化得到的通用 {@code Map}/{@code List} 结构，不依赖具体实体类型。
 * Java 集合的 {@code equals()} 本身就是按内容递归比较（{@code AbstractMap}/{@code
 * AbstractList}），天然避免了前端历史 bug 的那一类问题：两份内容相同但引用不同的空数组
 * （如 {@code entity.triggers}）用 {@code !==} 判会永远「不相等」，导致存版后仍显示假的
 * 「未保存版本」。此处统一用 {@link Objects#equals}，不会重犯。</p>
 */
public final class VersionDiffEngine {

    private VersionDiffEngine() {
    }

    private static final Set<String> FIELD_DIFF_SKIP = new HashSet<>(Arrays.asList("typeName", "dataType"));

    private static final List<String> PROFILE_MODELING_KEYS = Arrays.asList(
            "defaultFields", "defaultFieldsType", "sqlConfig", "wordTemplateConfig",
            "defaultDataSourceId", "tableLimit", "tableNameFormat"
    );

    /** 属性「压根不存在」的哨兵值，与「存在但值为 null」区分，对齐 JS undefined 语义 */
    private static final Object ABSENT = new Object();

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static List<Map<String, Object>> diff(Map<String, Object> current, Map<String, Object> baseline) {
        Map<String, Object> cur = current != null ? current : Collections.emptyMap();
        Map<String, Object> base = baseline != null ? baseline : Collections.emptyMap();

        List<Map<String, Object>> changes = new ArrayList<>();
        changes.addAll(compareTables(cur, base));
        changes.addAll(compareModules(cur, base));
        changes.addAll(compareProfile(asMap(cur.get("profile")), asMap(base.get("profile"))));
        changes.addAll(compareDataTypeDomains(asMap(cur.get("dataTypeDomains")), asMap(base.get("dataTypeDomains"))));
        return filterNoiseChanges(changes);
    }

    /** 过滤展示/北极星噪声（与 frontend filterNoiseChanges 对齐） */
    public static List<Map<String, Object>> filterNoiseChanges(List<Map<String, Object>> changes) {
        if (changes == null || changes.isEmpty()) {
            return Collections.emptyList();
        }
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> c : changes) {
            if ("field".equals(c.get("type")) && "update".equals(c.get("opt"))) {
                Object cd = c.get("changeData");
                if (cd != null && String.valueOf(cd).contains("undefined=>")) {
                    continue;
                }
            }
            out.add(c);
        }
        return out;
    }

    // ---- entities / fields / indexes ----

    private static List<Map<String, Object>> getAllTables(Map<String, Object> projectJson) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> mod : asMapList(projectJson.get("modules"))) {
            result.addAll(asMapList(mod.get("entities")));
        }
        return result;
    }

    private static List<Map<String, Object>> compareTables(Map<String, Object> cur, Map<String, Object> base) {
        List<Map<String, Object>> changes = new ArrayList<>();
        List<Map<String, Object>> currentTables = getAllTables(cur);
        List<Map<String, Object>> checkTables = getAllTables(base);
        Set<Object> checkTableNames = keys(checkTables, "title");
        Set<Object> currentTableNames = keys(currentTables, "title");

        for (Map<String, Object> table : currentTables) {
            Object title = table.get("title");
            if (checkTableNames.contains(title)) {
                Map<String, Object> checkTable = findByKey(checkTables, "title", title);
                List<Map<String, Object>> checkFields = filterNamed(asMapList(checkTable.get("fields")));
                List<Map<String, Object>> tableFields = filterNamed(asMapList(table.get("fields")));
                Set<Object> checkFieldNames = keys(checkFields, "name");
                Set<Object> tableFieldNames = keys(tableFields, "name");

                for (Map<String, Object> field : tableFields) {
                    Object fname = field.get("name");
                    if (!checkFieldNames.contains(fname)) {
                        changes.add(change("field", title + "." + fname, "add", null));
                    } else {
                        Map<String, Object> checkField = findByKey(checkFields, "name", fname);
                        changes.addAll(compareField(field, checkField, table));
                    }
                }
                for (Map<String, Object> field : checkFields) {
                    Object fname = field.get("name");
                    if (!tableFieldNames.contains(fname)) {
                        changes.add(change("field", title + "." + fname, "delete", null));
                    }
                }
                changes.addAll(compareEntity(omit(table, "fields", "indexs", "headers"), omit(checkTable, "fields", "indexs")));
                changes.addAll(compareIndexs(table, checkTable));
            } else {
                changes.add(change("entity", String.valueOf(title), "add", null));
            }
        }

        for (Map<String, Object> table : checkTables) {
            Object title = table.get("title");
            if (!currentTableNames.contains(title)) {
                changes.add(change("entity", String.valueOf(title), "delete", null));
            }
        }
        return changes;
    }

    private static List<Map<String, Object>> compareField(
            Map<String, Object> currentField, Map<String, Object> checkField, Map<String, Object> table) {
        List<Map<String, Object>> changes = new ArrayList<>();
        for (String name : currentField.keySet()) {
            if (FIELD_DIFF_SKIP.contains(name)) {
                continue;
            }
            Object curVal = valueOrAbsent(currentField, name);
            Object baseVal = valueOrAbsent(checkField, name);
            if (!Objects.equals(curVal, baseVal)) {
                changes.add(change("field",
                        table.get("title") + "." + currentField.get("name") + "." + name,
                        "update", formatChangeData(baseVal, curVal)));
            }
        }
        return changes;
    }

    private static List<Map<String, Object>> compareIndex(
            Map<String, Object> currentIndex, Map<String, Object> checkIndex, Map<String, Object> table) {
        List<Map<String, Object>> changes = new ArrayList<>();
        for (String name : currentIndex.keySet()) {
            Object curVal = valueOrAbsent(currentIndex, name);
            Object baseVal = valueOrAbsent(checkIndex, name);
            if (!Objects.equals(curVal, baseVal)) {
                changes.add(change("index",
                        table.get("title") + "." + currentIndex.get("name") + "." + name,
                        "update", formatChangeData(baseVal, curVal)));
            }
        }
        return changes;
    }

    private static List<Map<String, Object>> compareStringArray(
            List<Object> currentFields, List<Object> checkFields, String title, String indexName) {
        List<Map<String, Object>> changes = new ArrayList<>();
        for (Object f : currentFields) {
            if (!checkFields.contains(f)) {
                changes.add(change("index", title + "." + indexName + ".fields." + f, "update", "addField=>" + f));
            }
        }
        for (Object f : checkFields) {
            if (!currentFields.contains(f)) {
                changes.add(change("index", title + "." + indexName + ".fields." + f, "update", "deleteField=>" + f));
            }
        }
        return changes;
    }

    private static List<Map<String, Object>> compareIndexs(Map<String, Object> currentTable, Map<String, Object> checkTable) {
        List<Map<String, Object>> changes = new ArrayList<>();
        List<Map<String, Object>> currentIndexs = asMapList(currentTable.get("indexs"));
        List<Map<String, Object>> checkIndexs = asMapList(checkTable.get("indexs"));
        Set<Object> checkIndexNames = keys(checkIndexs, "name");
        Set<Object> currentIndexNames = keys(currentIndexs, "name");
        Object title = currentTable.get("title");

        for (Map<String, Object> cIndex : currentIndexs) {
            Object iname = cIndex.get("name");
            if (!checkIndexNames.contains(iname)) {
                changes.add(change("index", title + "." + iname, "add", null));
            } else {
                Map<String, Object> checkIndex = findByKey(checkIndexs, "name", iname);
                changes.addAll(compareIndex(omit(cIndex, "fields"), omit(checkIndex, "fields"), currentTable));
                changes.addAll(compareStringArray(
                        asList(cIndex.get("fields")), asList(checkIndex.get("fields")),
                        String.valueOf(title), String.valueOf(iname)));
            }
        }
        for (Map<String, Object> cIndex : checkIndexs) {
            Object iname = cIndex.get("name");
            if (!currentIndexNames.contains(iname)) {
                changes.add(change("index", title + "." + iname, "delete", null));
            }
        }
        return changes;
    }

    private static List<Map<String, Object>> compareEntity(Map<String, Object> currentTable, Map<String, Object> checkTable) {
        List<Map<String, Object>> changes = new ArrayList<>();
        for (String name : currentTable.keySet()) {
            Object curVal = valueOrAbsent(currentTable, name);
            Object baseVal = valueOrAbsent(checkTable, name);
            if (!Objects.equals(curVal, baseVal)) {
                changes.add(change("entity", currentTable.get("title") + "." + name, "update",
                        formatChangeData(baseVal, curVal)));
            }
        }
        return changes;
    }

    // ---- modules / associations / diagrams ----

    private static List<Map<String, Object>> compareModules(Map<String, Object> cur, Map<String, Object> base) {
        List<Map<String, Object>> changes = new ArrayList<>();
        List<Map<String, Object>> currentModules = asMapList(cur.get("modules"));
        List<Map<String, Object>> baselineModules = asMapList(base.get("modules"));
        Map<Object, Map<String, Object>> baseByName = byKey(baselineModules, "name");
        Map<Object, Map<String, Object>> curByName = byKey(currentModules, "name");

        for (Map.Entry<Object, Map<String, Object>> entry : curByName.entrySet()) {
            Object name = entry.getKey();
            Map<String, Object> mod = entry.getValue();
            if (!baseByName.containsKey(name)) {
                changes.add(change("module", String.valueOf(name), "add", null));
                continue;
            }
            Map<String, Object> baseMod = baseByName.get(name);
            if (!Objects.equals(mod.get("chnname"), baseMod.get("chnname"))) {
                changes.add(change("module", name + ".chnname", "update",
                        formatChangeData(baseMod.get("chnname"), mod.get("chnname"))));
            }
            changes.addAll(compareAssociations(String.valueOf(name),
                    asMapList(mod.get("associations")), asMapList(baseMod.get("associations"))));

            List<Map<String, Object>> modDiagrams = asMapList(mod.get("diagrams"));
            List<Map<String, Object>> baseDiagrams = asMapList(baseMod.get("diagrams"));
            boolean hasDiagrams = !modDiagrams.isEmpty() || !baseDiagrams.isEmpty();
            if (hasDiagrams) {
                changes.addAll(compareDiagrams(String.valueOf(name), modDiagrams, baseDiagrams));
            } else {
                changes.addAll(compareGraphCanvas(String.valueOf(name), mod.get("graphCanvas"), baseMod.get("graphCanvas")));
            }
        }
        for (Object name : baseByName.keySet()) {
            if (!curByName.containsKey(name)) {
                changes.add(change("module", String.valueOf(name), "delete", null));
            }
        }
        return changes;
    }

    static String associationKey(Map<String, Object> assoc) {
        Object cn = assoc.get("constraintName");
        if (cn != null && !String.valueOf(cn).isEmpty()) {
            return String.valueOf(cn);
        }
        Map<String, Object> from = asMap(assoc.get("from"));
        Map<String, Object> to = asMap(assoc.get("to"));
        return from.get("entity") + "." + from.get("field") + "->" + to.get("entity") + "." + to.get("field");
    }

    private static List<Map<String, Object>> compareAssociations(
            String moduleName, List<Map<String, Object>> current, List<Map<String, Object>> baseline) {
        List<Map<String, Object>> changes = new ArrayList<>();
        Map<String, Map<String, Object>> baseMap = new LinkedHashMap<>();
        for (Map<String, Object> a : baseline) {
            baseMap.put(associationKey(a), a);
        }
        Map<String, Map<String, Object>> curMap = new LinkedHashMap<>();
        for (Map<String, Object> a : current) {
            curMap.put(associationKey(a), a);
        }

        for (Map.Entry<String, Map<String, Object>> entry : curMap.entrySet()) {
            String key = entry.getKey();
            Map<String, Object> assoc = entry.getValue();
            String prefix = moduleName + "." + key;
            if (!baseMap.containsKey(key)) {
                changes.add(change("association", prefix, "add", null));
                continue;
            }
            Map<String, Object> base = baseMap.get(key);
            for (String prop : new String[]{"relation", "deleteRule", "updateRule", "constraintName"}) {
                if (!Objects.equals(assoc.get(prop), base.get(prop))) {
                    changes.add(change("association", prefix + "." + prop, "update",
                            formatChangeData(base.get(prop), assoc.get(prop))));
                }
            }
            if (!Objects.equals(assoc.get("from"), base.get("from"))) {
                changes.add(change("association", prefix + ".from", "update",
                        formatChangeData(base.get("from"), assoc.get("from"))));
            }
            if (!Objects.equals(assoc.get("to"), base.get("to"))) {
                changes.add(change("association", prefix + ".to", "update",
                        formatChangeData(base.get("to"), assoc.get("to"))));
            }
        }
        for (String key : baseMap.keySet()) {
            if (!curMap.containsKey(key)) {
                changes.add(change("association", moduleName + "." + key, "delete", null));
            }
        }
        return changes;
    }

    private static List<Map<String, Object>> compareDiagrams(
            String moduleName, List<Map<String, Object>> current, List<Map<String, Object>> baseline) {
        List<Map<String, Object>> changes = new ArrayList<>();
        Map<Object, Map<String, Object>> baseMap = byKey(filterHasKey(baseline, "id"), "id");
        Map<Object, Map<String, Object>> curMap = byKey(filterHasKey(current, "id"), "id");

        for (Map.Entry<Object, Map<String, Object>> entry : curMap.entrySet()) {
            Object id = entry.getKey();
            Map<String, Object> diagram = entry.getValue();
            String prefix = moduleName + "." + id;
            if (!baseMap.containsKey(id)) {
                changes.add(change("diagram", prefix, "add", null));
                continue;
            }
            Map<String, Object> base = baseMap.get(id);
            if (!Objects.equals(diagram.get("name"), base.get("name"))) {
                changes.add(change("diagram", prefix + ".name", "update",
                        formatChangeData(base.get("name"), diagram.get("name"))));
            }
            if (!Objects.equals(diagram.get("includeEntities"), base.get("includeEntities"))) {
                changes.add(change("diagram", prefix + ".includeEntities", "update",
                        formatChangeData(base.get("includeEntities"), diagram.get("includeEntities"))));
            }
            if (!Objects.equals(diagram.get("layout"), base.get("layout"))) {
                changes.add(change("diagram", prefix + ".layout", "update", "layout changed"));
            }
            if (!Objects.equals(diagram.get("groups"), base.get("groups"))) {
                changes.add(change("diagram", prefix + ".groups", "update", "groups changed"));
            }
        }
        for (Object id : baseMap.keySet()) {
            if (!curMap.containsKey(id)) {
                changes.add(change("diagram", moduleName + "." + id, "delete", null));
            }
        }
        return changes;
    }

    private static List<Map<String, Object>> compareGraphCanvas(String moduleName, Object current, Object baseline) {
        if (Objects.equals(current, baseline)) {
            return Collections.emptyList();
        }
        if (baseline == null) {
            return Collections.singletonList(change("diagram", moduleName + ".graphCanvas", "add", null));
        }
        if (current == null) {
            return Collections.singletonList(change("diagram", moduleName + ".graphCanvas", "delete", null));
        }
        return Collections.singletonList(change("diagram", moduleName + ".graphCanvas", "update", "graphCanvas changed"));
    }

    // ---- profile / dataTypeDomains ----

    private static List<Map<String, Object>> compareProfile(Map<String, Object> current, Map<String, Object> baseline) {
        List<Map<String, Object>> changes = new ArrayList<>();
        for (String key : PROFILE_MODELING_KEYS) {
            Object curVal = current.get(key);
            Object baseVal = baseline.get(key);
            if (!Objects.equals(curVal, baseVal)) {
                String opt = baseVal == null ? "add" : (curVal == null ? "delete" : "update");
                String changeData = (baseVal == null || curVal == null) ? null : "profile changed";
                changes.add(change("profile", key, opt, changeData));
            }
        }
        return changes;
    }

    private static List<Map<String, Object>> compareDataTypeDomains(Map<String, Object> current, Map<String, Object> baseline) {
        List<Map<String, Object>> changes = new ArrayList<>();
        changes.addAll(compareByCode(asMapList(current.get("datatype")), asMapList(baseline.get("datatype")), "datatype"));
        changes.addAll(compareByCode(asMapList(current.get("database")), asMapList(baseline.get("database")), "database"));
        return changes;
    }

    private static List<Map<String, Object>> compareByCode(
            List<Map<String, Object>> items, List<Map<String, Object>> baseItems, String label) {
        List<Map<String, Object>> changes = new ArrayList<>();
        Map<Object, Map<String, Object>> baseMap = byKey(filterHasKey(baseItems, "code"), "code");
        Map<Object, Map<String, Object>> curMap = byKey(filterHasKey(items, "code"), "code");

        for (Map.Entry<Object, Map<String, Object>> entry : curMap.entrySet()) {
            Object code = entry.getKey();
            Map<String, Object> item = entry.getValue();
            if (!baseMap.containsKey(code)) {
                changes.add(change("datatype", label + "." + code, "add", null));
            } else if (!Objects.equals(item, baseMap.get(code))) {
                changes.add(change("datatype", label + "." + code, "update", label + " changed"));
            }
        }
        for (Object code : baseMap.keySet()) {
            if (!curMap.containsKey(code)) {
                changes.add(change("datatype", label + "." + code, "delete", null));
            }
        }
        return changes;
    }

    // ---- generic helpers ----

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object o) {
        if (o instanceof Map) {
            return (Map<String, Object>) o;
        }
        return Collections.emptyMap();
    }

    @SuppressWarnings("unchecked")
    private static List<Object> asList(Object o) {
        if (o instanceof List) {
            return (List<Object>) o;
        }
        return Collections.emptyList();
    }

    private static List<Map<String, Object>> asMapList(Object o) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object item : asList(o)) {
            if (item instanceof Map) {
                result.add(asMap(item));
            }
        }
        return result;
    }

    private static Set<Object> keys(List<Map<String, Object>> items, String key) {
        Set<Object> s = new HashSet<>();
        for (Map<String, Object> item : items) {
            s.add(item.get(key));
        }
        return s;
    }

    private static Map<String, Object> findByKey(List<Map<String, Object>> items, String key, Object value) {
        for (Map<String, Object> item : items) {
            if (Objects.equals(item.get(key), value)) {
                return item;
            }
        }
        return Collections.emptyMap();
    }

    private static List<Map<String, Object>> filterNamed(List<Map<String, Object>> items) {
        return filterHasKey(items, "name");
    }

    private static List<Map<String, Object>> filterHasKey(List<Map<String, Object>> items, String key) {
        List<Map<String, Object>> r = new ArrayList<>();
        for (Map<String, Object> item : items) {
            Object v = item.get(key);
            if (v != null && !"".equals(v)) {
                r.add(item);
            }
        }
        return r;
    }

    /** 按 key 建索引；跳过 key 缺失/空串的项（对齐 JS 的 truthy 过滤） */
    private static Map<Object, Map<String, Object>> byKey(List<Map<String, Object>> items, String key) {
        Map<Object, Map<String, Object>> m = new LinkedHashMap<>();
        for (Map<String, Object> item : items) {
            Object k = item.get(key);
            if (k != null && !"".equals(k)) {
                m.put(k, item);
            }
        }
        return m;
    }

    private static Map<String, Object> omit(Map<String, Object> map, String... omitKeys) {
        Map<String, Object> copy = new LinkedHashMap<>(map);
        for (String k : omitKeys) {
            copy.remove(k);
        }
        return copy;
    }

    private static Object valueOrAbsent(Map<String, Object> map, String key) {
        return map.containsKey(key) ? map.get(key) : ABSENT;
    }

    /** 非原始值走 JSON 序列化展示，避免对象/数组被隐式 toString 成无意义文本 */
    private static String formatScalar(Object value) {
        if (value == ABSENT) {
            return "undefined";
        }
        if (value == null) {
            return "null";
        }
        if (value instanceof Map || value instanceof List) {
            try {
                return MAPPER.writeValueAsString(value);
            } catch (Exception e) {
                return String.valueOf(value);
            }
        }
        return String.valueOf(value);
    }

    private static String formatChangeData(Object before, Object after) {
        return formatScalar(before) + "=>" + formatScalar(after);
    }

    private static Map<String, Object> change(String type, String name, String opt, String changeData) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("type", type);
        m.put("name", name);
        m.put("opt", opt);
        if (changeData != null) {
            m.put("changeData", changeData);
        }
        return m;
    }
}
