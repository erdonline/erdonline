package com.erdonline.erd.util;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 解析 projectJSON / classpath 模板源，经 doT→Freemarker 适配后由 {@link DdlFreemarkerTemplateEngine} 渲染。
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
        String ftlSource = resolveFtlSource(templateKey, dialectCode, databaseRow);
        return renderFtlSource(ftlSource, context);
    }

    public static String renderInline(String templateSource, Map<String, Object> context) {
        if (templateSource == null || templateSource.isBlank()) {
            return "";
        }
        String ftlSource = resolveInlineFtl(templateSource, Map.of());
        return renderFtlSource(ftlSource, context);
    }

    public static String renderInline(String templateSource, Map<String, Object> databaseRow,
                                      Map<String, Object> context) {
        if (templateSource == null || templateSource.isBlank()) {
            return "";
        }
        String ftlSource = resolveInlineFtl(templateSource, databaseRow);
        return renderFtlSource(ftlSource, context);
    }

    private static String renderFtlSource(String ftlSource, Map<String, Object> context) {
        if (ftlSource.isBlank()) {
            return "";
        }
        Map<String, Object> enriched = DdlTemplateContextEnricher.enrich(context);
        return DdlFreemarkerTemplateEngine.renderLiteral(ftlSource, enriched);
    }

    private static String resolveInlineFtl(String templateSource, Map<String, Object> databaseRow) {
        if (shouldTranslateDot(databaseRow, templateSource)) {
            return TRANSLATED_CACHE.computeIfAbsent(templateSource, DotToFreemarkerTranslator::translate);
        }
        return templateSource;
    }

    static String resolveFtlSource(String templateKey, String dialectCode, Map<String, Object> databaseRow) {
        String custom = templateFromRow(databaseRow, templateKey);
        if (custom.isBlank()) {
            if (DdlFreemarkerTemplateEngine.classpathTemplateExists(dialectCode, templateKey)) {
                return DdlFreemarkerTemplateEngine.loadClasspathAsString(dialectCode, templateKey);
            }
            return "";
        }
        return resolveInlineFtl(custom, databaseRow);
    }

    private static boolean shouldTranslateDot(Map<String, Object> databaseRow, String custom) {
        String syntax = ProjectJsonSupport.str(databaseRow.get(DdlTemplateSyntax.FIELD));
        if (DdlTemplateSyntax.FREEMARKER.equalsIgnoreCase(syntax)) {
            return false;
        }
        if (DdlTemplateSyntax.DOT.equalsIgnoreCase(syntax)) {
            return true;
        }
        return DotToFreemarkerTranslator.looksLikeDot(custom);
    }

    private static String templateFromRow(Map<String, Object> databaseRow, String templateKey) {
        if (databaseRow == null || databaseRow.isEmpty()) {
            return "";
        }
        Object tpl = databaseRow.get(templateKey);
        return tpl != null ? String.valueOf(tpl) : "";
    }
}
