package com.erdonline.erd.util;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** 前端 json2code {@code it.func} 的 Java 实现，供 Freemarker 共享方法与单测复用。 */
public final class DdlTemplateFunc {

    private static final Pattern UNDERSCORE_WORD = Pattern.compile("_([\\w+])");

    private DdlTemplateFunc() {
    }

    public static String camel(String str, boolean firstUpper) {
        String ret = str == null ? "" : str.toLowerCase(Locale.ROOT);
        Matcher m = UNDERSCORE_WORD.matcher(ret);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            m.appendReplacement(sb, m.group(1).toUpperCase(Locale.ROOT));
        }
        m.appendTail(sb);
        ret = sb.toString();
        if (firstUpper && !ret.isEmpty()) {
            ret = Character.toUpperCase(ret.charAt(0)) + ret.substring(1);
        }
        return ret;
    }

    public static String underline(String str, boolean upper) {
        String ret = str == null ? "" : str.replaceAll("([A-Z])", "_$1");
        return upper ? ret.toUpperCase(Locale.ROOT) : ret.toLowerCase(Locale.ROOT);
    }

    public static String join(Object... args) {
        if (args.length == 0) {
            return "";
        }
        if (args.length <= 2) {
            return args[0] == null ? "" : String.valueOf(args[0]);
        }
        String delimiter = String.valueOf(args[args.length - 1]);
        List<String> datas = new ArrayList<>();
        for (int i = 0; i < args.length - 1; i++) {
            String s = args[i] == null ? "" : String.valueOf(args[i]).trim();
            if (!s.isEmpty()) {
                datas.add(s);
            }
        }
        return String.join(delimiter, datas);
    }

    public static List<Object> intersect(List<Object> a, List<Object> b) {
        List<Object> out = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        for (Object o : uniquelize(a)) {
            if (contains(b, o) && seen.add(jsonKey(o))) {
                out.add(o);
            }
        }
        return out;
    }

    public static List<Object> union(List<Object> a, List<Object> b) {
        List<Object> copy = new ArrayList<>(a);
        copy.addAll(b);
        return uniquelize(copy);
    }

    public static List<Object> minus(List<Object> a, List<Object> b) {
        List<Object> out = new ArrayList<>();
        for (Object o : uniquelize(a)) {
            if (!contains(b, o)) {
                out.add(o);
            }
        }
        return out;
    }

    private static List<Object> uniquelize(List<Object> array) {
        List<Object> temp = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        for (Object o : array) {
            String k = jsonKey(o);
            if (seen.add(k)) {
                temp.add(o);
            }
        }
        return temp;
    }

    private static boolean contains(List<Object> array, Object obj) {
        for (Object o : array) {
            if (equalsLoose(o, obj)) {
                return true;
            }
        }
        return false;
    }

    private static boolean equalsLoose(Object v1, Object v2) {
        if (v1 instanceof Map<?, ?> && v2 instanceof Map<?, ?>) {
            return Objects.equals(jsonKey(v1), jsonKey(v2));
        }
        return Objects.equals(v1, v2);
    }

    private static String jsonKey(Object o) {
        if (o instanceof Map) {
            return JsonUtil.generate(o);
        }
        return String.valueOf(o);
    }
}
