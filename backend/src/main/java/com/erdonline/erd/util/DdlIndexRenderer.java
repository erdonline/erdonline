package com.erdonline.erd.util;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 建索引 SQL：带 filter 且方言支持时用 CREATE INDEX … WHERE；否则走 doT 模板。
 */
public final class DdlIndexRenderer {

    private DdlIndexRenderer() {
    }

    public static String renderCreateIndexSql(
            String template,
            Map<String, Object> templateData,
            String dialectCode) {
        Map<String, Object> index = ProjectJsonSupport.asMap(templateData.get(DdlTemplateKeys.CTX_INDEX));
        String pred = DdlDialectSupport.formatIndexFilterPredicate(index.get("filter"));
        if (pred != null && DdlDialectSupport.dialectSupportsIndexFilter(dialectCode)) {
            Map<String, Object> entity = ProjectJsonSupport.asMap(templateData.get(DdlTemplateKeys.CTX_ENTITY));
            String sep = ProjectJsonSupport.str(templateData.get(DdlTemplateKeys.CTX_SEPARATOR));
            boolean uniq = Boolean.TRUE.equals(index.get("isUnique"));
            String name = ProjectJsonSupport.str(index.get(ProjectJsonKeys.NAME)).trim();
            String table = ProjectJsonSupport.str(entity.get(ProjectJsonKeys.TITLE)).trim();
            if (table.isEmpty()) {
                table = ProjectJsonSupport.str(entity.get(ProjectJsonKeys.NAME)).trim();
            }
            List<Object> fieldList = index.get("fields") instanceof List<?> l ? new ArrayList<>(l) : List.of();
            String cols = fieldList.stream()
                    .map(f -> ProjectJsonSupport.str(f).trim())
                    .filter(s -> !s.isEmpty())
                    .reduce((a, b) -> a + "," + b)
                    .orElse("");
            return "CREATE" + (uniq ? " UNIQUE" : "") + " INDEX " + name
                    + " ON " + table + "(" + cols + ") WHERE " + pred + ";" + sep;
        }
        return DdlTemplateRenderer.renderInline(template, templateData);
    }
}
