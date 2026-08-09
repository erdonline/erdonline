package com.erdonline.erd.util;

/**
 * projectJSON {@code database[]} 模板语法标注（ADR-0030）。
 */
public final class DdlTemplateSyntax {

    /** projectJSON database[] 行上的字段名 */
    public static final String FIELD = "templateSyntax";

    public static final String FREEMARKER = "freemarker";
    public static final String DOT = "dot";

    private DdlTemplateSyntax() {
    }
}
