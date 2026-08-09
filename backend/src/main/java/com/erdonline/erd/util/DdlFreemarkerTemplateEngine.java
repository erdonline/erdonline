package com.erdonline.erd.util;

import freemarker.core.TemplateClassResolver;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import freemarker.template.TemplateExceptionHandler;

import java.io.IOException;
import java.io.StringReader;
import java.io.StringWriter;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** JVM 原生 Freemarker 模板引擎：编译缓存 + DDL 共享方法（ADR-0030 终态）。 */
public final class DdlFreemarkerTemplateEngine {

    private static final Configuration CONFIG = buildConfiguration();
    private static final ConcurrentHashMap<String, Template> LITERAL_CACHE = new ConcurrentHashMap<>();

    private static final List<String> TEMPLATE_KEYS = List.of(
            DdlTemplateKeys.CREATE_TABLE,
            DdlTemplateKeys.UPDATE_TABLE_COMMENT,
            DdlTemplateKeys.DELETE_TABLE,
            DdlTemplateKeys.CREATE_INDEX,
            DdlTemplateKeys.REBUILD_TABLE,
            DdlTemplateKeys.CREATE_FIELD,
            DdlTemplateKeys.UPDATE_FIELD,
            DdlTemplateKeys.DELETE_FIELD,
            DdlTemplateKeys.DELETE_INDEX,
            DdlTemplateKeys.CREATE_PK,
            DdlTemplateKeys.DELETE_PK);

    private DdlFreemarkerTemplateEngine() {
    }

    private static Configuration buildConfiguration() {
        Configuration cfg = new Configuration(Configuration.VERSION_2_3_32);
        cfg.setDefaultEncoding(StandardCharsets.UTF_8.name());
        cfg.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);
        cfg.setLogTemplateExceptions(false);
        cfg.setWrapUncheckedExceptions(true);
        cfg.setFallbackOnNullLoopVariable(false);
        cfg.setClassicCompatible(true);
        cfg.setNewBuiltinClassResolver(TemplateClassResolver.SAFER_RESOLVER);
        cfg.setClassLoaderForTemplateLoading(
                DdlFreemarkerTemplateEngine.class.getClassLoader(), "ddl/freemarker");
        DdlFreemarkerMethods.registerSharedVariables(cfg);
        return cfg;
    }

    public static String renderLiteral(String ftlSource, Map<String, Object> context) {
        if (ftlSource == null || ftlSource.isBlank()) {
            return "";
        }
        try {
            Template template = LITERAL_CACHE.computeIfAbsent(ftlSource, key -> {
                try {
                    return new Template("ddl-literal-" + key.hashCode(), new StringReader(key), CONFIG);
                } catch (IOException e) {
                    throw new DdlTemplateException("Freemarker compile failed: " + e.getMessage(), e);
                }
            });
            StringWriter writer = new StringWriter();
            template.process(context != null ? context : Map.of(), writer);
            return postProcess(writer.toString());
        } catch (TemplateException | IOException e) {
            throw new DdlTemplateException("Freemarker template render failed: " + e.getMessage(), e);
        }
    }

    public static String renderClasspath(String dialectCode, String templateKey, Map<String, Object> context) {
        String path = classpathFor(dialectCode, templateKey);
        try {
            Template template = CONFIG.getTemplate(path);
            StringWriter writer = new StringWriter();
            template.process(context != null ? context : Map.of(), writer);
            return postProcess(writer.toString());
        } catch (TemplateException | IOException e) {
            throw new DdlTemplateException("Freemarker classpath template failed [" + path + "]: "
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
        return dialectResourcePrefix(dialectCode) + "/" + templateKey + ".ftl";
    }

    static boolean classpathTemplateExists(String dialectCode, String templateKey) {
        String path = "ddl/freemarker/" + classpathFor(dialectCode, templateKey);
        return DdlFreemarkerTemplateEngine.class.getClassLoader().getResource(path) != null;
    }

    static String loadClasspathAsString(String dialectCode, String templateKey) {
        String path = "ddl/freemarker/" + classpathFor(dialectCode, templateKey);
        try (var in = DdlFreemarkerTemplateEngine.class.getClassLoader().getResourceAsStream(path)) {
            if (in == null) {
                return null;
            }
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** classpath 默认 Freemarker 源码（ADR-0030：custom > seed；编辑器占位用） */
    public static Map<String, String> loadAllClasspathSources(String dialectCode) {
        Map<String, String> out = new LinkedHashMap<>();
        for (String templateKey : TEMPLATE_KEYS) {
            String source = loadClasspathAsString(dialectCode, templateKey);
            if (source != null && !source.isBlank()) {
                out.put(templateKey, source);
            }
        }
        return out;
    }
}
