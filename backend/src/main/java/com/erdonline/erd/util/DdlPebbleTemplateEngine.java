package com.erdonline.erd.util;

import io.pebbletemplates.pebble.PebbleEngine;
import io.pebbletemplates.pebble.error.PebbleException;
import io.pebbletemplates.pebble.template.PebbleTemplate;

import java.io.IOException;
import java.io.StringWriter;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** JVM 原生 Pebble 模板引擎：编译缓存 + DDL 扩展。 */
public final class DdlPebbleTemplateEngine {

    private static final PebbleEngine ENGINE = new PebbleEngine.Builder()
            .extension(new DdlPebbleExtension())
            .cacheActive(true)
            .autoEscaping(false)
            .build();

    private static final ConcurrentHashMap<String, PebbleTemplate> LITERAL_CACHE = new ConcurrentHashMap<>();

    private DdlPebbleTemplateEngine() {
    }

    public static String renderLiteral(String pebbleSource, Map<String, Object> context) {
        if (pebbleSource == null || pebbleSource.isBlank()) {
            return "";
        }
        try {
            PebbleTemplate template = LITERAL_CACHE.computeIfAbsent(pebbleSource, key -> {
                try {
                    return ENGINE.getLiteralTemplate(key);
                } catch (PebbleException e) {
                    throw new DdlTemplateException("Pebble compile failed: " + e.getMessage(), e);
                }
            });
            StringWriter writer = new StringWriter();
            template.evaluate(writer, context != null ? context : Map.of());
            return postProcess(writer.toString());
        } catch (PebbleException | IOException e) {
            throw new DdlTemplateException("Pebble template render failed: " + e.getMessage(), e);
        }
    }

    public static String renderClasspath(String classpathTemplate, Map<String, Object> context) {
        if (classpathTemplate == null || classpathTemplate.isBlank()) {
            return "";
        }
        try {
            PebbleTemplate template = ENGINE.getTemplate(classpathTemplate);
            StringWriter writer = new StringWriter();
            template.evaluate(writer, context != null ? context : Map.of());
            return postProcess(writer.toString());
        } catch (PebbleException | IOException e) {
            throw new DdlTemplateException("Pebble classpath template failed [" + classpathTemplate + "]: "
                    + e.getMessage(), e);
        }
    }

    private static String postProcess(String text) {
        return text.replace("$blankline", "\n")
                .replaceAll("\n(\n)*( )*(\n)*\n", "\n");
    }

    static String dialectResourcePrefix(String dialectCode) {
        String norm = DdlDialectSupport.normalizeDialectCode(dialectCode);
        if (norm.equals("mysql") || norm.equals("mariadb")) {
            return "mysql";
        }
        if (norm.equals("postgresql") || norm.equals("postgres") || norm.equals("pg")) {
            return "postgresql";
        }
        if (norm.equals("oracle")) {
            return "oracle";
        }
        if (norm.equals("sqlserver") || norm.equals("mssql")) {
            return "sqlserver";
        }
        return norm.isEmpty() ? "mysql" : norm;
    }

    static String classpathFor(String dialectCode, String templateKey) {
        return "ddl/pebble/" + dialectResourcePrefix(dialectCode) + "/" + templateKey + ".pebble";
    }

    static boolean classpathTemplateExists(String dialectCode, String templateKey) {
        String path = classpathFor(dialectCode, templateKey);
        return DdlPebbleTemplateEngine.class.getClassLoader().getResource(path) != null;
    }

    static String loadClasspathAsString(String dialectCode, String templateKey) {
        String path = classpathFor(dialectCode, templateKey);
        try (var in = DdlPebbleTemplateEngine.class.getClassLoader().getResourceAsStream(path)) {
            if (in == null) {
                return null;
            }
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
