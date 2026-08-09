package com.erdonline.erd.util;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 渲染前 enrich：预计算 doT 模板中的 evaluate 状态（pkList/sameCols），并补齐 field.dataType。
 */
public final class DdlTemplateContextEnricher {

    private DdlTemplateContextEnricher() {
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> enrich(Map<String, Object> ctx) {
        Map<String, Object> out = new LinkedHashMap<>(ctx != null ? ctx : Map.of());

        Map<String, Object> entity = ProjectJsonSupport.asMap(out.get(DdlTemplateKeys.CTX_ENTITY));
        if (!entity.isEmpty()) {
            out.put(DdlTemplateKeys.CTX_ENTITY, enrichEntity(entity));
            out.put("pkFieldNames", pkFieldNames(entity));
        }

        Map<String, Object> newEntity = ProjectJsonSupport.asMap(out.get(DdlTemplateKeys.CTX_NEW_ENTITY));
        Map<String, Object> oldEntity = ProjectJsonSupport.asMap(out.get(DdlTemplateKeys.CTX_OLD_ENTITY));
        if (!newEntity.isEmpty()) {
            out.put(DdlTemplateKeys.CTX_NEW_ENTITY, enrichEntity(newEntity));
            out.put("newPkFieldNames", pkFieldNames(newEntity));
        }
        if (!oldEntity.isEmpty()) {
            out.put(DdlTemplateKeys.CTX_OLD_ENTITY, enrichEntity(oldEntity));
        }
        if (!newEntity.isEmpty() && !oldEntity.isEmpty()) {
            out.put("sameCols", intersectFields(newEntity, oldEntity));
        }

        Map<String, Object> field = ProjectJsonSupport.asMap(out.get(DdlTemplateKeys.CTX_FIELD));
        if (!field.isEmpty()) {
            out.put(DdlTemplateKeys.CTX_FIELD, enrichField(field));
        }

        return out;
    }

    private static Map<String, Object> enrichEntity(Map<String, Object> entity) {
        Map<String, Object> copy = new LinkedHashMap<>(entity);
        List<Map<String, Object>> fields = new ArrayList<>();
        for (Map<String, Object> f : ProjectJsonSupport.asMapList(entity.get(ProjectJsonKeys.FIELDS))) {
            fields.add(enrichField(f));
        }
        copy.put(ProjectJsonKeys.FIELDS, fields);
        return copy;
    }

    private static Map<String, Object> enrichField(Map<String, Object> field) {
        Map<String, Object> f = new LinkedHashMap<>(field);
        String type = ProjectJsonSupport.str(f.get(ProjectJsonKeys.TYPE));
        if (type.isEmpty()) {
            type = ProjectJsonSupport.str(f.get("dataType"));
        }
        if (!type.isEmpty()) {
            f.put(ProjectJsonKeys.TYPE, type);
            f.put("dataType", type);
        }
        return f;
    }

    private static List<String> pkFieldNames(Map<String, Object> entity) {
        List<String> names = new ArrayList<>();
        for (Map<String, Object> f : ProjectJsonSupport.asMapList(entity.get(ProjectJsonKeys.FIELDS))) {
            if (Boolean.TRUE.equals(f.get("pk"))) {
                names.add(ProjectJsonSupport.str(f.get(ProjectJsonKeys.NAME)));
            }
        }
        return names;
    }

    private static List<Map<String, Object>> intersectFields(
            Map<String, Object> newEntity,
            Map<String, Object> oldEntity) {
        List<Object> a = new ArrayList<>(ProjectJsonSupport.asMapList(newEntity.get(ProjectJsonKeys.FIELDS)));
        List<Object> b = new ArrayList<>(ProjectJsonSupport.asMapList(oldEntity.get(ProjectJsonKeys.FIELDS)));
        @SuppressWarnings("unchecked")
        List<Object> inter = DdlTemplateFunc.intersect(a, b);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object o : inter) {
            if (o instanceof Map<?, ?> m) {
                result.add(enrichField(ProjectJsonSupport.asMap(m)));
            }
        }
        return result;
    }
}
