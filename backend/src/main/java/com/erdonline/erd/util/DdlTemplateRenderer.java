package com.erdonline.erd.util;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 解析 projectJSON / classpath 模板源，经 doT→Pebble 适配后由 {@link DdlPebbleTemplateEngine} 渲染。
 */
public final class DdlTemplateRenderer {

    private static final ConcurrentHashMap<String, String> TRANSLATED_CACHE = new ConcurrentHashMap<>();

    private DdlTemplateRenderer() {
    }

    public static String render(
            String templateKey,
            String dialectCode,
            Map<String, Object> databaseRow,
            Map<String, Object> context) {
        String pebbleSource = resolvePebbleSource(templateKey, dialectCode, databaseRow);
        return renderPebbleSource(pebbleSource, context);
    }

    public static String renderInline(String templateSource, Map<String, Object> context) {
        if (templateSource == null || templateSource.isBlank()) {
            return "";
        }
        String pebbleSource = looksLikeDotAndTranslate(templateSource);
        return renderPebbleSource(pebbleSource, context);
    }

    private static String renderPebbleSource(String pebbleSource, Map<String, Object> context) {
        if (pebbleSource.isBlank()) {
            return "";
        }
        Map<String, Object> enriched = DdlTemplateContextEnricher.enrich(context);
        return DdlPebbleTemplateEngine.renderLiteral(pebbleSource, enriched);
    }

    private static String looksLikeDotAndTranslate(String templateSource) {
        if (!DotToPebbleTranslator.looksLikeDot(templateSource)) {
            return templateSource;
        }
        return TRANSLATED_CACHE.computeIfAbsent(templateSource, DotToPebbleTranslator::translate);
    }

    static String resolvePebbleSource(String templateKey, String dialectCode, Map<String, Object> databaseRow) {
        String custom = templateFromRow(databaseRow, templateKey);
        if (custom.isBlank()) {
            return classpathPebble(dialectCode, templateKey);
        }
        if (!DotToPebbleTranslator.looksLikeDot(custom)) {
            return custom;
        }
        return looksLikeDotAndTranslate(custom);
    }

    private static String templateFromRow(Map<String, Object> databaseRow, String templateKey) {
        if (databaseRow == null || databaseRow.isEmpty()) {
            return "";
        }
        Object tpl = databaseRow.get(templateKey);
        return tpl != null ? String.valueOf(tpl) : "";
    }

    private static String classpathPebble(String dialectCode, String templateKey) {
        if (DdlPebbleTemplateEngine.classpathTemplateExists(dialectCode, templateKey)) {
            return DdlPebbleTemplateEngine.loadClasspathAsString(dialectCode, templateKey);
        }
        return "";
    }
}
