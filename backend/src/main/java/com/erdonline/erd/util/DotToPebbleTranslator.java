package com.erdonline.erd.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 将 projectJSON 存量 doT 模板确定性转换为 Pebble 语法（覆盖 defaultData 所用子集）。
 * evaluate 状态（pkList/sameCols）由 {@link DdlTemplateContextEnricher} 预计算后替换引用。
 */
public final class DotToPebbleTranslator {

    private static final Pattern INTERPOLATE = Pattern.compile("\\{\\{=([\\s\\S]+?)\\}\\}");
    private static final Pattern ITERATE_OPEN = Pattern.compile(
            "\\{\\{~\\s*([\\s\\S]+?)\\s*:\\s*([\\w$]+)\\s*(?::\\s*([\\w$]+))?\\s*\\}\\}");
    private static final Pattern ITERATE_CLOSE = Pattern.compile("\\{\\{~\\s*\\}\\}");
    private static final Pattern CONDITIONAL_OPEN = Pattern.compile("\\{\\{\\?\\?\\s*\\}\\}");
    private static final Pattern CONDITIONAL_ELSE = Pattern.compile("\\{\\{\\?\\s*([^}?][\\s\\S]*?)\\s*\\}\\}");
    private static final Pattern CONDITIONAL_CLOSE = Pattern.compile("\\{\\{\\?\\s*\\}\\}");
    private static final Pattern EVALUATE = Pattern.compile("\\{\\{([\\s\\S]+?)\\}\\}");

    private DotToPebbleTranslator() {
    }

    public static boolean looksLikeDot(String template) {
        return template != null && template.contains("{{");
    }

    public static String translate(String dotTemplate) {
        if (dotTemplate == null || dotTemplate.isBlank()) {
            return "";
        }
        String s = dotTemplate.replace("$blankline", "\n");

        // evaluate：pkList / sameCols 累积由 Java enrich 承担
        s = s.replaceAll("\\{\\{\\s*pkList\\s*=\\s*\\[\\]\\s*;\\s*\\}\\}", "");
        s = s.replaceAll("\\{\\{\\?\\s*field\\.pk\\s*\\}\\}\\{\\{\\s*pkList\\.push\\([^)]+\\)\\s*\\}\\}\\{\\{\\?\\s*\\}\\}", "");
        s = s.replaceAll(
                "\\{\\{\\s*sameCols\\s*=\\s*it\\.func\\.intersect\\([^)]+\\)\\s*;\\s*\\}\\}", "");

        s = replaceCommaInterpolations(s);
        s = replacePkListReferences(s);

        // 去掉其余 evaluate 块
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
            return "{% for " + var + " in " + arr + " %}";
        });
        s = ITERATE_CLOSE.matcher(s).replaceAll("{% endfor %}");

        s = CONDITIONAL_OPEN.matcher(s).replaceAll("{% else %}");
        s = CONDITIONAL_ELSE.matcher(s).replaceAll(m -> "{% if " + normalizeExpr(m.group(1).trim()) + " %}");
        s = CONDITIONAL_CLOSE.matcher(s).replaceAll("{% endif %}");

        s = INTERPOLATE.matcher(s).replaceAll(m -> "{{ " + normalizeExpr(m.group(1).trim()) + " }}");

        return s;
    }

    private static String replaceCommaInterpolations(String s) {
        String r = s;
        r = r.replaceAll(
                "\\{\\{=\\s*index\\s*<\\s*it\\.entity\\.fields\\.length-1 \\? ',' : \\( pkList\\.length>0 \\? ',' :'' \\)\\s*\\}\\}",
                "{% if not loop.last or pkFieldNames|length > 0 %},{% endif %}");
        r = r.replaceAll(
                "\\{\\{=\\s*index\\s*<\\s*it\\.newEntity\\.fields\\.length-1 \\? ',' : \\( pkList\\.length>0 \\? ',' :'' \\)\\s*\\}\\}",
                "{% if not loop.last or newPkFieldNames|length > 0 %},{% endif %}");
        r = r.replaceAll(
                "\\{\\{=\\s*i\\s*<\\s*pkList\\.length-1 \\? ',' : '' \\s*\\}\\}",
                "{% if not loop.last %},{% endif %}");
        r = r.replaceAll(
                "\\{\\{=\\s*i\\s*<\\s*pkFieldNames\\|length-1 \\? ',' : '' \\s*\\}\\}",
                "{% if not loop.last %},{% endif %}");
        r = r.replaceAll("\\{\\{\\?\\s*index<sameCols\\.length-1\\s*\\}\\},\\{\\{\\?\\s*\\}\\}",
                "{% if not loop.last %},{% endif %}");
        return r;
    }

    private static String replacePkListReferences(String s) {
        String r = s;
        r = r.replace("pkList.length", "pkFieldNames|length");
        r = r.replace("{{~pkList:pkName:i}}", "{% for pkName in pkFieldNames %}");
        r = r.replace("i<pkFieldNames|length-1", "not loop.last");
        r = r.replace("index < it.entity.fields.length-1 ? ',' : ( pkFieldNames|length>0 ? ',' :'' )",
                "{% if not loop.last or pkFieldNames|length > 0 %},{% endif %}");
        r = r.replace("index < it.newEntity.fields.length-1 ? ',' : ( pkFieldNames|length>0 ? ',' :'' )",
                "{% if not loop.last or newPkFieldNames|length > 0 %},{% endif %}");
        r = r.replace("index < it.newEntity.fields.length-1 ? ',' : ( pkList.length>0 ? ',' :'' )",
                "{% if not loop.last or newPkFieldNames|length > 0 %},{% endif %}");
        r = r.replace("index < it.entity.fields.length-1 ? ',' : ( pkList.length>0 ? ',' :'' )",
                "{% if not loop.last or pkFieldNames|length > 0 %},{% endif %}");
        r = r.replace("index<sameCols.length-1", "not loop.last");
        r = r.replace("{{? index<sameCols.length-1}},{{?}}", "{% if not loop.last %},{% endif %}");
        r = r.replace("{{? index<sameCols.length-1}},{{?}}", "{% if not loop.last %},{% endif %}");
        return r;
    }

    private static String normalizeExpr(String expr) {
        String e = expr;
        e = e.replace("it.func.join", "erdJoin");
        e = e.replace("it.func.camel", "camel");
        e = e.replace("it.func.underline", "underline");
        e = e.replace("it.func.upperCase", "upper");
        e = e.replace("it.func.lowerCase", "lower");
        e = e.replace("it.func.intersect", "intersect");
        e = e.replace("it.func.union", "union");
        e = e.replace("it.func.minus", "minus");
        if (e.startsWith("it.")) {
            e = e.substring(3);
        }
        e = e.replaceAll("erdJoin\\(([^,]+),\\s*([^,]+),\\s*'([^']*)'\\)", "erdJoin(a=$1, b=$2, delimiter='$3')");
        e = e.replaceAll("erdJoin\\(([^,]+),\\s*'([^']*)'\\)", "erdJoin(a=$1, delimiter='$2')");
        e = e.replaceAll("erdJoin\\('DEFAULT',\\s*([^,]+),\\s*'([^']*)'\\)",
                "(field.defaultValue ? ('DEFAULT ' ~ $1) : '')");
        return e;
    }
}
