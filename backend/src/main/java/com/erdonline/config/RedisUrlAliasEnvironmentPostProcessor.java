package com.erdonline.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.util.StringUtils;

/**
 * Bridges PaaS Redis env into {@code spring.data.redis.*} before binding.
 *
 * <p>Railway Redis plugin Variable Reference names (use as-is on the App service):
 * {@code REDISHOST}, {@code REDISPORT}, {@code REDISPASSWORD}, {@code REDISUSER},
 * {@code REDIS_URL}, {@code REDIS_PUBLIC_URL}, {@code REDIS_PASSWORD}.
 *
 * <p>Why this exists (Boot 3 + Redisson 3.37):
 * <ul>
 *   <li>{@code REDIS_URL} / {@code REDIS_PUBLIC_URL} must force host/port/password —
 *       YAML defaults to {@code localhost} when split host vars are absent; Redisson
 *       may also fall back to {@code RedisProperties.getHost()}.
 *   <li>YAML must not use {@code password: ${REDIS_PASSWORD:}} — empty defaults bind
 *       {@code ""} → Redis 6 ACL {@code WRONGPASS} / break local no-auth Redis.
 * </ul>
 */
public class RedisUrlAliasEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    static final String PROPERTY_SOURCE_NAME = "erdRedisUrlAlias";

    /** Startup diagnostics (no password). */
    static final String RESOLVED_HOST_PROPERTY = "erd.redis.resolved-host";
    static final String RESOLVED_PORT_PROPERTY = "erd.redis.resolved-port";
    static final String RESOLVED_SOURCE_PROPERTY = "erd.redis.resolved-source";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> extras = new LinkedHashMap<>(16);

        // URL wins over host defaults. Prefer private → REDIS_URL → public.
        String[] urlKeys = {"REDIS_PRIVATE_URL", "REDIS_URL", "REDIS_PUBLIC_URL", "REDISURL"};
        String urlSource = null;
        String redisUrl = null;
        for (String key : urlKeys) {
            String value = environment.getProperty(key);
            if (StringUtils.hasText(value)) {
                redisUrl = value;
                urlSource = key;
                break;
            }
        }
        if (redisUrl == null) {
            String springUrl = environment.getProperty("spring.data.redis.url");
            if (StringUtils.hasText(springUrl)) {
                redisUrl = springUrl;
                urlSource = "spring.data.redis.url";
            }
        }
        if (redisUrl != null) {
            extras.put("spring.data.redis.url", redisUrl);
            applyParsedUrl(extras, redisUrl, urlSource);
        }

        // Split vars — Railway plugin names first (REDISHOST / REDISPORT / …)
        if (!extras.containsKey("spring.data.redis.host")) {
            String host = firstNonBlank(environment, "REDISHOST", "REDIS_HOST");
            if (host != null) {
                extras.put("spring.data.redis.host", host);
                extras.put(RESOLVED_HOST_PROPERTY, host);
                extras.put(
                        RESOLVED_SOURCE_PROPERTY,
                        StringUtils.hasText(environment.getProperty("REDISHOST")) ? "REDISHOST" : "REDIS_HOST");
            }
        }
        if (!extras.containsKey("spring.data.redis.port")) {
            String port = firstNonBlank(environment, "REDISPORT", "REDIS_PORT");
            if (port != null) {
                extras.put("spring.data.redis.port", port);
                extras.put(RESOLVED_PORT_PROPERTY, port);
            }
        }

        // Password / ACL user: only non-blank; plugin names first
        if (!extras.containsKey("spring.data.redis.password")) {
            String password = firstNonBlank(environment, "REDISPASSWORD", "REDIS_PASSWORD");
            if (password != null) {
                extras.put("spring.data.redis.password", password);
            }
        }
        if (!extras.containsKey("spring.data.redis.username")) {
            String username = firstNonBlank(environment, "REDISUSER", "REDIS_USERNAME", "REDIS_USER");
            if (username != null) {
                extras.put("spring.data.redis.username", username);
            }
        }

        // Diagnostics when nothing set host (local default)
        if (!extras.containsKey(RESOLVED_HOST_PROPERTY)) {
            String host = firstNonBlank(environment, "REDISHOST", "REDIS_HOST");
            extras.put(RESOLVED_HOST_PROPERTY, host != null ? host : "localhost");
            if (!extras.containsKey(RESOLVED_SOURCE_PROPERTY)) {
                extras.put(RESOLVED_SOURCE_PROPERTY, host != null ? "env" : "default");
            }
        }
        if (!extras.containsKey(RESOLVED_PORT_PROPERTY)) {
            String port = firstNonBlank(environment, "REDISPORT", "REDIS_PORT");
            extras.put(RESOLVED_PORT_PROPERTY, port != null ? port : "6379");
        }

        environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, extras));

        // Visible in Railway logs before Logback is ready
        System.out.println("[erd] Redis target host="
                + extras.get(RESOLVED_HOST_PROPERTY)
                + " port="
                + extras.get(RESOLVED_PORT_PROPERTY)
                + " via="
                + extras.get(RESOLVED_SOURCE_PROPERTY));
    }

    /** Parse {@code redis://[user:pass@]host:port[/db]} and force host/port/user/password. */
    static void applyParsedUrl(Map<String, Object> extras, String redisUrl, String source) {
        try {
            URI uri = URI.create(redisUrl.trim());
            if (StringUtils.hasText(uri.getHost())) {
                extras.put("spring.data.redis.host", uri.getHost());
                extras.put(RESOLVED_HOST_PROPERTY, uri.getHost());
                extras.put(RESOLVED_SOURCE_PROPERTY, source);
            }
            if (uri.getPort() > 0) {
                extras.put("spring.data.redis.port", Integer.toString(uri.getPort()));
                extras.put(RESOLVED_PORT_PROPERTY, Integer.toString(uri.getPort()));
            }
            String userInfo = uri.getUserInfo();
            if (StringUtils.hasText(userInfo)) {
                int colon = userInfo.indexOf(':');
                if (colon < 0) {
                    extras.put("spring.data.redis.username", decode(userInfo));
                } else {
                    String user = userInfo.substring(0, colon);
                    String pass = userInfo.substring(colon + 1);
                    if (StringUtils.hasText(user)) {
                        extras.put("spring.data.redis.username", decode(user));
                    }
                    if (StringUtils.hasText(pass)) {
                        extras.put("spring.data.redis.password", decode(pass));
                    }
                }
            }
            String path = uri.getPath();
            if (StringUtils.hasText(path) && path.length() > 1) {
                try {
                    extras.put("spring.data.redis.database", Integer.parseInt(path.substring(1)));
                } catch (NumberFormatException ignored) {
                    // leave default
                }
            }
        } catch (IllegalArgumentException ex) {
            System.err.println("[erd] Redis URL parse failed (" + source + "): " + ex.getMessage());
            extras.put(RESOLVED_SOURCE_PROPERTY, source + "(unparsed)");
        }
    }

    private static String decode(String raw) {
        return URLDecoder.decode(raw, StandardCharsets.UTF_8);
    }

    private static String firstNonBlank(ConfigurableEnvironment environment, String... keys) {
        for (String key : keys) {
            String value = environment.getProperty(key);
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return null;
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 20;
    }
}
