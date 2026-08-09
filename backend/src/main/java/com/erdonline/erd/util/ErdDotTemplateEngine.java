package com.erdonline.erd.util;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 精简 doT：支持 {@code {{=it.entity.title}}} 与 {@code {{=it.separator}}}。
 * 复杂 createTableTemplate（含字段循环）由 {@link VersionDdlEngine#buildCreateTableSql} 兜底。
 */
final class ErdDotTemplateEngine {

    private ErdDotTemplateEngine() {
    }

    private static final Pattern INTERPOLATE = Pattern.compile("\\{\\{=([\\s\\S]+?)\\}\\}");

    static String render(String template, Map<String, Object> root) {
        if (template == null || template.isBlank()) {
            return "";
        }
        Map<String, Object> it = new LinkedHashMap<>();
        it.put("entity", root.get("entity"));
        it.put("module", root.get("module"));
        it.put("separator", root.get("separator"));
        Map<String, Object> ctx = Map.of("it", it);

        Matcher m = INTERPOLATE.matcher(template);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            String expr = m.group(1).trim();
            Object val = eval(expr, ctx);
            m.appendReplacement(sb, Matcher.quoteReplacement(val == null ? "" : String.valueOf(val)));
        }
        m.appendTail(sb);
        return sb.toString().replace("$blankline", "\n");
    }

    private static Object eval(String expr, Map<String, Object> ctx) {
        if (!expr.startsWith("it.")) {
            return "";
        }
        Object cur = ctx.get("it");
        String[] parts = expr.substring(3).split("\\.");
        for (String p : parts) {
            if (cur instanceof Map) {
                cur = ((Map<?, ?>) cur).get(p);
            } else {
                return "";
            }
        }
        return cur;
    }
}
