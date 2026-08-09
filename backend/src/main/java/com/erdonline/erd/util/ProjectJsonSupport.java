package com.erdonline.erd.util;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** projectJSON Map/List 安全访问（与 VersionDdlEngine 原 helper 对齐，供 DDL 管线复用）。 */
public final class ProjectJsonSupport {

    private ProjectJsonSupport() {
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> asMap(Object o) {
        if (o instanceof Map) {
            return (Map<String, Object>) o;
        }
        return Map.of();
    }

    public static List<Map<String, Object>> asMapList(Object o) {
        List<Map<String, Object>> result = new ArrayList<>();
        if (o instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map) {
                    result.add(asMap(item));
                }
            }
        }
        return result;
    }

    public static String str(Object o) {
        return o == null ? "" : String.valueOf(o);
    }

    public static List<Map<String, Object>> allEntities(Map<String, Object> dataSource, String moduleNameKey) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> mod : asMapList(dataSource.get(ProjectJsonKeys.MODULES))) {
            for (Map<String, Object> e : asMapList(mod.get(ProjectJsonKeys.ENTITIES))) {
                Map<String, Object> copy = new LinkedHashMap<>(e);
                copy.put(moduleNameKey, mod.get(ProjectJsonKeys.NAME));
                result.add(copy);
            }
        }
        return result;
    }

    public static Map<String, Object> findEntityByTitle(List<Map<String, Object>> entities, String title) {
        for (Map<String, Object> e : entities) {
            if (ProjectJsonSupport.str(e.get(ProjectJsonKeys.TITLE)).equals(title)) {
                return e;
            }
        }
        return null;
    }

    public static Map<String, Object> findFieldByName(Map<String, Object> entity, String name) {
        for (Map<String, Object> f : asMapList(entity.get(ProjectJsonKeys.FIELDS))) {
            if (ProjectJsonSupport.str(f.get(ProjectJsonKeys.NAME)).equals(name)) {
                return f;
            }
        }
        return null;
    }

    public static Map<String, Object> findIndexByName(Map<String, Object> entity, String name) {
        for (Map<String, Object> idx : asMapList(entity.get(ProjectJsonKeys.INDEXS))) {
            if (ProjectJsonSupport.str(idx.get(ProjectJsonKeys.NAME)).equals(name)) {
                return idx;
            }
        }
        return null;
    }

    public static List<Map<String, Object>> datatypeList(Map<String, Object> dataSource) {
        Map<String, Object> domains = asMap(dataSource.get(ProjectJsonKeys.DATA_TYPE_DOMAINS));
        return asMapList(domains.get(ProjectJsonKeys.DATATYPE));
    }

    public static List<Map<String, Object>> databaseList(Map<String, Object> dataSource) {
        Map<String, Object> domains = asMap(dataSource.get(ProjectJsonKeys.DATA_TYPE_DOMAINS));
        return asMapList(domains.get(ProjectJsonKeys.DATABASE));
    }

    public static Map<String, Object> enrichEntityFields(
            Map<String, Object> entity,
            List<Map<String, Object>> datatype,
            String dialectCode) {
        Map<String, Object> copy = new LinkedHashMap<>(entity);
        List<Map<String, Object>> fields = new ArrayList<>();
        for (Map<String, Object> field : asMapList(entity.get(ProjectJsonKeys.FIELDS))) {
            Map<String, Object> f = new LinkedHashMap<>(field);
            f.put(ProjectJsonKeys.TYPE,
                    DdlDialectSupport.resolveFieldType(datatype, str(f.get(ProjectJsonKeys.TYPE)), dialectCode));
            String resolved = str(f.get(ProjectJsonKeys.TYPE));
            if (!resolved.isEmpty()) {
                f.put("dataType", resolved);
            }
            fields.add(f);
        }
        copy.put(ProjectJsonKeys.FIELDS, fields);
        return copy;
    }
}
