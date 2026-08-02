package com.erdonline.erd.reverse;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * JDBC {@code DatabaseMetaData#getColumns} 的 {@code COLUMN_DEF} → projectJSON {@code fields[].defaultValue}。
 *
 * <p>约定对齐 DBML/DDL：字符串字面量带单引号；数字原样；表达式（如 {@code CURRENT_TIMESTAMP}）原样。
 */
public final class DefaultValueMapper {

    private static final Pattern NUMERIC = Pattern.compile("^-?\\d+(\\.\\d+)?$");
    private static final Pattern PG_TYPED_STRING = Pattern.compile("^('(?:[^']|'')*')::.+$", Pattern.DOTALL);
    private static final Pattern PG_TYPED_NUMBER = Pattern.compile("^(-?\\d+(?:\\.\\d+)?)::.+$");
    private static final Pattern ALREADY_QUOTED = Pattern.compile("^('(?:[^']|'')*'|\"(?:[^\"]|\"\")*\")$", Pattern.DOTALL);

    private DefaultValueMapper() {
    }

    /**
     * @return 规范化后的 defaultValue；空/NULL 返回 {@code null}（调用方不写入）
     */
    public static String normalizeJdbcColumnDef(String columnDef) {
        if (columnDef == null) {
            return null;
        }
        String raw = columnDef.trim();
        if (raw.isEmpty() || "NULL".equalsIgnoreCase(raw)) {
            return null;
        }

        Matcher pgString = PG_TYPED_STRING.matcher(raw);
        if (pgString.matches()) {
            return pgString.group(1);
        }
        Matcher pgNumber = PG_TYPED_NUMBER.matcher(raw);
        if (pgNumber.matches()) {
            return pgNumber.group(1);
        }

        if (ALREADY_QUOTED.matcher(raw).matches()) {
            if (raw.charAt(0) == '"') {
                String inner = raw.substring(1, raw.length() - 1).replace("\"\"", "\"");
                return "'" + inner.replace("'", "''") + "'";
            }
            return raw;
        }

        if (NUMERIC.matcher(raw).matches()) {
            return raw;
        }
        if ("TRUE".equalsIgnoreCase(raw) || "FALSE".equalsIgnoreCase(raw)) {
            return raw.toUpperCase(Locale.ROOT);
        }
        if (isExpression(raw)) {
            return stripOuterParens(raw);
        }
        // MySQL information_schema / JDBC 常把字符串默认值无引号返回（如 NEW）
        return "'" + raw.replace("'", "''") + "'";
    }

    private static boolean isExpression(String raw) {
        String upper = raw.toUpperCase(Locale.ROOT);
        if (upper.contains("(") || upper.contains(")") || upper.startsWith("B'") || upper.startsWith("X'")) {
            return true;
        }
        return upper.equals("CURRENT_TIMESTAMP")
                || upper.equals("CURRENT_DATE")
                || upper.equals("CURRENT_TIME")
                || upper.equals("LOCALTIMESTAMP")
                || upper.equals("LOCALTIME")
                || upper.equals("NOW")
                || upper.equals("SYSDATE")
                || upper.equals("SYSTIMESTAMP")
                || upper.startsWith("CURRENT_TIMESTAMP")
                || upper.startsWith("NEXTVAL");
    }

    private static String stripOuterParens(String raw) {
        String s = raw;
        while (s.length() >= 2 && s.charAt(0) == '(' && s.charAt(s.length() - 1) == ')') {
            String inner = s.substring(1, s.length() - 1).trim();
            if (inner.isEmpty() || !balanced(inner)) {
                break;
            }
            s = inner;
        }
        return s;
    }

    private static boolean balanced(String s) {
        int depth = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '(') {
                depth++;
            } else if (c == ')') {
                depth--;
                if (depth < 0) {
                    return false;
                }
            }
        }
        return depth == 0;
    }
}
