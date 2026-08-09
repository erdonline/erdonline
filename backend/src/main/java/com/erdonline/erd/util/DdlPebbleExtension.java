package com.erdonline.erd.util;

import io.pebbletemplates.pebble.extension.AbstractExtension;
import io.pebbletemplates.pebble.extension.Filter;
import io.pebbletemplates.pebble.template.EvaluationContext;
import io.pebbletemplates.pebble.template.PebbleTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Pebble 扩展：复刻前端 json2code {@code it.func.*} 助手。
 */
public final class DdlPebbleExtension extends AbstractExtension {

    @Override
    public Map<String, Filter> getFilters() {
        return Map.of(
                "join", new JoinFilter(),
                "camel", new CamelFilter(),
                "underline", new UnderlineFilter(),
                "upper", new UpperFilter(),
                "lower", new LowerFilter());
    }

    @Override
    public Map<String, io.pebbletemplates.pebble.extension.Function> getFunctions() {
        return Map.of(
                "intersect", new IntersectFunction(),
                "union", new UnionFunction(),
                "minus", new MinusFunction(),
                "erdJoin", new ErdJoinFunction());
    }

    private static final class JoinFilter implements Filter {
        @Override
        public Object apply(Object input, Map<String, Object> args, PebbleTemplate self,
                            EvaluationContext context, int lineNumber) {
            List<Object> values = input instanceof List<?> l ? new ArrayList<>(l) : List.of(input);
            String delimiter = String.valueOf(args.getOrDefault("delimiter", " "));
            List<String> parts = new ArrayList<>();
            for (Object v : values) {
                String s = v == null ? "" : String.valueOf(v).trim();
                if (!s.isEmpty()) {
                    parts.add(s);
                }
            }
            return String.join(delimiter, parts);
        }

        @Override
        public List<String> getArgumentNames() {
            return List.of("delimiter");
        }
    }

    private static final class CamelFilter implements Filter {
        @Override
        public Object apply(Object input, Map<String, Object> args, PebbleTemplate self,
                            EvaluationContext context, int lineNumber) {
            boolean firstUpper = Boolean.TRUE.equals(args.get("firstUpper"));
            return DdlTemplateFunc.camel(String.valueOf(input), firstUpper);
        }

        @Override
        public List<String> getArgumentNames() {
            return List.of("firstUpper");
        }
    }

    private static final class UnderlineFilter implements Filter {
        @Override
        public Object apply(Object input, Map<String, Object> args, PebbleTemplate self,
                            EvaluationContext context, int lineNumber) {
            boolean upper = Boolean.TRUE.equals(args.get("upper"));
            return DdlTemplateFunc.underline(String.valueOf(input), upper);
        }

        @Override
        public List<String> getArgumentNames() {
            return List.of("upper");
        }
    }

    private static final class UpperFilter implements Filter {
        @Override
        public Object apply(Object input, Map<String, Object> args, PebbleTemplate self,
                            EvaluationContext context, int lineNumber) {
            return String.valueOf(input).toUpperCase(Locale.ROOT);
        }

        @Override
        public List<String> getArgumentNames() {
            return List.of();
        }
    }

    private static final class LowerFilter implements Filter {
        @Override
        public Object apply(Object input, Map<String, Object> args, PebbleTemplate self,
                            EvaluationContext context, int lineNumber) {
            return String.valueOf(input).toLowerCase(Locale.ROOT);
        }

        @Override
        public List<String> getArgumentNames() {
            return List.of();
        }
    }

    private abstract static class BinaryListFunction implements io.pebbletemplates.pebble.extension.Function {
        @Override
        @SuppressWarnings("unchecked")
        public Object execute(Map<String, Object> args, PebbleTemplate self,
                              EvaluationContext context, int lineNumber) {
            List<Object> a = args.get("a") instanceof List<?> l ? new ArrayList<>(l) : List.of();
            List<Object> b = args.get("b") instanceof List<?> l ? new ArrayList<>(l) : List.of();
            return compute(a, b);
        }

        protected abstract List<Object> compute(List<Object> a, List<Object> b);

        @Override
        public List<String> getArgumentNames() {
            return List.of("a", "b");
        }
    }

    private static final class IntersectFunction extends BinaryListFunction {
        @Override
        protected List<Object> compute(List<Object> a, List<Object> b) {
            return DdlTemplateFunc.intersect(a, b);
        }
    }

    private static final class UnionFunction extends BinaryListFunction {
        @Override
        protected List<Object> compute(List<Object> a, List<Object> b) {
            return DdlTemplateFunc.union(a, b);
        }
    }

    private static final class MinusFunction extends BinaryListFunction {
        @Override
        protected List<Object> compute(List<Object> a, List<Object> b) {
            return DdlTemplateFunc.minus(a, b);
        }
    }

    /** 复刻 it.func.join：跳过空白参数后拼接。 */
    private static final class ErdJoinFunction implements io.pebbletemplates.pebble.extension.Function {
        @Override
        public Object execute(Map<String, Object> args, PebbleTemplate self,
                              EvaluationContext context, int lineNumber) {
            List<String> parts = new ArrayList<>();
            for (Map.Entry<String, Object> e : args.entrySet()) {
                if ("delimiter".equals(e.getKey())) {
                    continue;
                }
                String s = e.getValue() == null ? "" : String.valueOf(e.getValue()).trim();
                if (!s.isEmpty()) {
                    parts.add(s);
                }
            }
            String delimiter = String.valueOf(args.getOrDefault("delimiter", " "));
            return String.join(delimiter, parts);
        }

        @Override
        public List<String> getArgumentNames() {
            return List.of("a", "b", "c", "d", "delimiter");
        }
    }
}
