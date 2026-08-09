package com.erdonline.erd.util;

import java.util.regex.Pattern;

/**
 * 将 projectJSON 存量 doT 模板确定性转换为 Freemarker 语法（覆盖 defaultData 所用子集）。
 * evaluate 状态（pkList/sameCols）由 {@link DdlTemplateContextEnricher} 预计算后替换引用。
 */
public final class DotToFreemarkerTranslator {

    private static final Pattern INTERPOLATE = Pattern.compile("\\{\\{=([\\s\\S]+?)\\}\\}");
    private static final Pattern ITERATE_OPEN = Pattern.compile(
            "\\{\\{~\\s*([\\s\\S]+?)\\s*:\\s*([\\w$]+)\\s*(?::\\s*([\\w$]+))?\\s*\\}\\}");
    private static final Pattern ITERATE_CLOSE = Pattern.compile("\\{\\{~\\s*\\}\\}");
    private static final Pattern CONDITIONAL_OPEN = Pattern.compile("\\{\\{\\?\\?\\s*\\}\\}");
    private static final Pattern CONDITIONAL_ELSE = Pattern.compile("\\{\\{\\?\\s*([^}?][\\s\\S]*?)\\s*\\}\\}");
    private static final Pattern CONDITIONAL_CLOSE = Pattern.compile("\\{\\{\\?\\s*\\}\\}");
    private static final Pattern EVALUATE = Pattern.compile("\\{\\{([\\s\\S]+?)\\}\\}");

    private DotToFreemarkerTranslator() {
    }

    public static boolean looksLikeDot(String template) {
        return template != null && template.contains("{{");
    }

    public static String translate(String dotTemplate) {
        if (dotTemplate == null || dotTemplate.isBlank()) {
            return "";
        }
        String s = dotTemplate.replace("$blankline", "\n");

        s = s.replaceAll("\\{\\{\\s*pkList\\s*=\\s*\\[\\]\\s*;\\s*\\}\\}", "");
        s = s.replaceAll("\\{\\{\\?\\s*field\\.pk\\s*\\}\\}\\{\\{\\s*pkList\\.push\\([^)]+\\)\\s*\\}\\}\\{\\{\\?\\s*\\}\\}", "");
        s = s.replaceAll(
                "\\{\\{\\s*sameCols\\s*=\\s*it\\.func\\.intersect\\([^)]+\\)\\s*;\\s*\\}\\}", "");

        s = replaceCommaInterpolations(s);
        s = replacePkListReferences(s);

        s = EVALUATE.matcher(s).replaceAll(m -> {
            String code = m.group(1).trim();
            if (code.startsWith("=") || code.startsWith("?") || code.startsWith("~") || code.startsWith("!")) {
                return m.group(0);
            }
            return "";
        });

        s = ITERATE_OPEN.matcher(s).replaceAll(m -> {
            String arr = normalizeExpr(m.group(1).trim());
            String var = m.group(2).trim();
            return "<#list " + arr + " as " + var + ">";
        });
        s = ITERATE_CLOSE.matcher(s).replaceAll("</#list>");

        s = CONDITIONAL_OPEN.matcher(s).replaceAll("<#else>");
        s = CONDITIONAL_ELSE.matcher(s).replaceAll(m -> "<#if " + normalizeExpr(m.group(1).trim()) + ">");
        s = CONDITIONAL_CLOSE.matcher(s).replaceAll("</#if>");

        s = INTERPOLATE.matcher(s).replaceAll(m -> java.util.regex.Matcher.quoteReplacement(
                "${" + normalizeExpr(m.group(1).trim()) + "}"));

        return s;
    }

    private static String replaceCommaInterpolations(String s) {
        String r = s;
        r = r.replaceAll(
                "\\{\\{=\\s*index\\s*<\\s*it\\.entity\\.fields\\.length-1 \\? ',' : \\( pkList\\.length>0 \\? ',' :'' \\)\\s*\\}\\}",
                "<#if field?has_next || (pkFieldNames?size > 0)>,</#if>");
        r = r.replaceAll(
                "\\{\\{=\\s*index\\s*<\\s*it\\.newEntity\\.fields\\.length-1 \\? ',' : \\( pkList\\.length>0 \\? ',' :'' \\)\\s*\\}\\}",
                "<#if field?has_next || (newPkFieldNames?size > 0)>,</#if>");
        r = r.replaceAll(
                "\\{\\{=\\s*i\\s*<\\s*pkList\\.length-1 \\? ',' : '' \\s*\\}\\}",
                "<#if pkName?has_next>,</#if>");
        r = r.replaceAll(
                "\\{\\{=\\s*i\\s*<\\s*pkFieldNames\\|length-1 \\? ',' : '' \\s*\\}\\}",
                "<#if pkName?has_next>,</#if>");
        r = r.replaceAll("\\{\\{\\?\\s*index<sameCols\\.length-1\\s*\\}\\},\\{\\{\\?\\s*\\}\\}",
                "<#if field?has_next>,</#if>");
        return r;
    }

    private static String replacePkListReferences(String s) {
        String r = s;
        r = r.replace("pkList.length", "pkFieldNames?size");
        r = r.replace("{{~pkList:pkName:i}}", "<#list pkFieldNames as pkName>");
        r = r.replace("i<pkFieldNames?size-1", "!pkName?has_next");
        r = r.replace("index < it.entity.fields.length-1 ? ',' : ( pkFieldNames?size>0 ? ',' :'' )",
                "<#if field?has_next || (pkFieldNames?size > 0)>,</#if>");
        r = r.replace("index < it.newEntity.fields.length-1 ? ',' : ( pkFieldNames?size>0 ? ',' :'' )",
                "<#if field?has_next || (newPkFieldNames?size > 0)>,</#if>");
        r = r.replace("index < it.newEntity.fields.length-1 ? ',' : ( pkList.length>0 ? ',' :'' )",
                "<#if field?has_next || (newPkFieldNames?size > 0)>,</#if>");
        r = r.replace("index < it.entity.fields.length-1 ? ',' : ( pkList.length>0 ? ',' :'' )",
                "<#if field?has_next || (pkFieldNames?size > 0)>,</#if>");
        r = r.replace("index<sameCols.length-1", "field?has_next");
        r = r.replace("{{? index<sameCols.length-1}},{{?}}", "<#if field?has_next>,</#if>");
        return r;
    }

    private static String normalizeExpr(String expr) {
        String e = expr;
        e = e.replaceAll(
                "(\\w+(?:\\.\\w+)*) \\? it\\.func\\.join\\('DEFAULT',\\1,' '\\) : ''",
                "($1?has_content)?then('DEFAULT ' + $1?c, '')");
        e = convertJsTernaries(e);
        e = convertParenTernaries(e);
        e = e.replace("it.func.join(...", "erdJoin(");
        e = e.replace("it.func.join(", "erdJoin(");
        e = e.replace("erdJoin(...", "erdJoin(");
        e = e.replace("...", "");
        e = e.replace("it.func.camel", "camel");
        e = e.replace("it.func.underline", "underline");
        e = e.replace("it.func.upperCase", "upper");
        e = e.replace("it.func.lowerCase", "lower");
        e = e.replace("it.func.intersect", "intersect");
        e = e.replace("it.func.union", "union");
        e = e.replace("it.func.minus", "minus");
        e = e.replace("it.", "");
        e = e.replaceAll("erdJoin\\(\\.\\.\\.([^,]+),\\s*'([^']*)'\\)", "erdJoin($1, '$2')");
        e = e.replaceAll("erdJoin\\(\\.\\.\\.([^,]+),\\s*\"([^\"]*)\"\\)", "erdJoin($1, '$2')");
        return e;
    }

    /** doT/JS 三元 → Freemarker {@code bool?then(a,b)}（defaultData 模板高频模式）。 */
    private static String convertJsTernaries(String expr) {
        java.util.regex.Pattern p = java.util.regex.Pattern.compile(
                "([\\w.]+)\\s*\\?\\s*'([^']*)'\\s*:\\s*'([^']*)'");
        java.util.regex.Matcher m = p.matcher(expr);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            m.appendReplacement(sb, java.util.regex.Matcher.quoteReplacement(
                    m.group(1) + "?then('" + m.group(2) + "', '" + m.group(3) + "')"));
        }
        m.appendTail(sb);
        return sb.toString();
    }

    private static String convertParenTernaries(String expr) {
        java.util.regex.Pattern p = java.util.regex.Pattern.compile(
                "\\(\\s*([^?()]+?)\\s*\\?\\s*'([^']*)'\\s*:\\s*'([^']*)'\\s*\\)");
        java.util.regex.Matcher m = p.matcher(expr);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            m.appendReplacement(sb, java.util.regex.Matcher.quoteReplacement(
                    "(" + m.group(1).trim() + ")?then('" + m.group(2) + "', '" + m.group(3) + "')"));
        }
        m.appendTail(sb);
        return sb.toString();
    }
}
