package com.erdonline.erd.util;

import freemarker.ext.beans.BeansWrapper;
import freemarker.template.Configuration;
import freemarker.template.TemplateMethodModelEx;
import freemarker.template.TemplateModel;
import freemarker.template.TemplateModelException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Freemarker 共享方法：复刻前端 json2code {@code it.func.*} 与 Pebble 期 erdJoin。
 */
public final class DdlFreemarkerMethods {

    private DdlFreemarkerMethods() {
    }

    public static void registerSharedVariables(Configuration cfg) {
        cfg.setSharedVariable("erdJoin", new ErdJoinMethod());
        cfg.setSharedVariable("camel", new CamelMethod());
        cfg.setSharedVariable("underline", new UnderlineMethod());
        cfg.setSharedVariable("upper", new UpperMethod());
        cfg.setSharedVariable("lower", new LowerMethod());
        cfg.setSharedVariable("intersect", new IntersectMethod());
        cfg.setSharedVariable("union", new UnionMethod());
        cfg.setSharedVariable("minus", new MinusMethod());
    }

    private static String unwrap(TemplateModel model) throws TemplateModelException {
        if (model == null) {
            return "";
        }
        Object wrapped = BeansWrapper.getDefaultInstance().unwrap(model);
        return wrapped == null ? "" : String.valueOf(wrapped);
    }

    private static List<Object> unwrapList(List<?> args) throws TemplateModelException {
        List<Object> out = new ArrayList<>();
        for (Object arg : args) {
            if (arg instanceof TemplateModel tm) {
                out.add(BeansWrapper.getDefaultInstance().unwrap(tm));
            } else {
                out.add(arg);
            }
        }
        return out;
    }

    /** 跳过空白参数后拼接；末位可为 delimiter 字符串；首参可为 List（doT spread 兼容）。 */
    private static final class ErdJoinMethod implements TemplateMethodModelEx {
        @Override
        @SuppressWarnings("rawtypes")
        public Object exec(List args) throws TemplateModelException {
            if (args == null || args.isEmpty()) {
                return "";
            }
            List<Object> values = unwrapList(args);
            String delimiter = " ";
            if (values.size() >= 2 && values.get(values.size() - 1) instanceof String s
                    && s.length() <= 4 && !s.contains(" ")) {
                delimiter = s;
                values = values.subList(0, values.size() - 1);
            }
            List<String> parts = new ArrayList<>();
            for (Object v : values) {
                if (v instanceof List<?> list) {
                    for (Object item : list) {
                        String s = item == null ? "" : String.valueOf(item).trim();
                        if (!s.isEmpty()) {
                            parts.add(s);
                        }
                    }
                } else {
                    String s = v == null ? "" : String.valueOf(v).trim();
                    if (!s.isEmpty()) {
                        parts.add(s);
                    }
                }
            }
            return String.join(delimiter, parts);
        }
    }

    private static final class CamelMethod implements TemplateMethodModelEx {
        @Override
        @SuppressWarnings("rawtypes")
        public Object exec(List args) throws TemplateModelException {
            if (args == null || args.isEmpty()) {
                return "";
            }
            String input = unwrap((TemplateModel) args.get(0));
            boolean firstUpper = args.size() > 1 && Boolean.parseBoolean(unwrap((TemplateModel) args.get(1)));
            return DdlTemplateFunc.camel(input, firstUpper);
        }
    }

    private static final class UnderlineMethod implements TemplateMethodModelEx {
        @Override
        @SuppressWarnings("rawtypes")
        public Object exec(List args) throws TemplateModelException {
            if (args == null || args.isEmpty()) {
                return "";
            }
            String input = unwrap((TemplateModel) args.get(0));
            boolean upper = args.size() > 1 && Boolean.parseBoolean(unwrap((TemplateModel) args.get(1)));
            return DdlTemplateFunc.underline(input, upper);
        }
    }

    private static final class UpperMethod implements TemplateMethodModelEx {
        @Override
        @SuppressWarnings("rawtypes")
        public Object exec(List args) throws TemplateModelException {
            if (args == null || args.isEmpty()) {
                return "";
            }
            return unwrap((TemplateModel) args.get(0)).toUpperCase(Locale.ROOT);
        }
    }

    private static final class LowerMethod implements TemplateMethodModelEx {
        @Override
        @SuppressWarnings("rawtypes")
        public Object exec(List args) throws TemplateModelException {
            if (args == null || args.isEmpty()) {
                return "";
            }
            return unwrap((TemplateModel) args.get(0)).toLowerCase(Locale.ROOT);
        }
    }

    private abstract static class BinaryListMethod implements TemplateMethodModelEx {
        @Override
        @SuppressWarnings({"rawtypes", "unchecked"})
        public Object exec(List args) throws TemplateModelException {
            List<Object> a = args != null && args.size() > 0
                    ? unwrapList(List.of(args.get(0))) : List.of();
            List<Object> b = args != null && args.size() > 1
                    ? unwrapList(List.of(args.get(1))) : List.of();
            if (a.size() == 1 && a.get(0) instanceof List<?> l) {
                a = new ArrayList<>(l);
            }
            if (b.size() == 1 && b.get(0) instanceof List<?> l) {
                b = new ArrayList<>(l);
            }
            return compute(a, b);
        }

        protected abstract List<Object> compute(List<Object> a, List<Object> b);
    }

    private static final class IntersectMethod extends BinaryListMethod {
        @Override
        protected List<Object> compute(List<Object> a, List<Object> b) {
            return DdlTemplateFunc.intersect(a, b);
        }
    }

    private static final class UnionMethod extends BinaryListMethod {
        @Override
        protected List<Object> compute(List<Object> a, List<Object> b) {
            return DdlTemplateFunc.union(a, b);
        }
    }

    private static final class MinusMethod extends BinaryListMethod {
        @Override
        protected List<Object> compute(List<Object> a, List<Object> b) {
            return DdlTemplateFunc.minus(a, b);
        }
    }
}
