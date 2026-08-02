package com.erdonline.config;

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
 * <p>Why this exists (Boot 3 + Redisson 3.37):
 * <ul>
 *   <li>Railway exposes {@code REDIS_URL} / {@code REDIS_PRIVATE_URL}
 *       ({@code redis://default:pass@host:port}); Redisson honors
 *       {@code spring.data.redis.url} (and otherwise host/port/password).
 *   <li>YAML must not use {@code password: ${REDIS_PASSWORD:}} / {@code username: ${…:}} —
 *       empty defaults bind {@code ""} (not {@code null}). Redisson then sends
 *       {@code AUTH "" password} → Redis 6 ACL {@code WRONGPASS}, and {@code AUTH ""}
 *       breaks local no-password Redis.
 *   <li>Empty URL defaults in YAML ({@code url: ${REDIS_URL:}}) also break URI parsing.
 * </ul>
 */
public class RedisUrlAliasEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    static final String PROPERTY_SOURCE_NAME = "erdRedisUrlAlias";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> extras = new LinkedHashMap<>(8);

        if (!StringUtils.hasText(environment.getProperty("spring.data.redis.url"))) {
            // Prefer private URL on Railway (same VPC); fall back to public REDIS_URL
            String redisUrl = firstNonBlank(environment, "REDIS_PRIVATE_URL", "REDIS_URL", "REDISURL");
            if (redisUrl != null) {
                extras.put("spring.data.redis.url", redisUrl);
            }
        }

        // Only inject when non-blank — never write "" (Redisson treats "" as set)
        String password = firstNonBlank(environment, "REDIS_PASSWORD", "REDISPASSWORD");
        if (password != null && !StringUtils.hasText(environment.getProperty("spring.data.redis.password"))) {
            extras.put("spring.data.redis.password", password);
        }

        // Redis 6 ACL (Railway REDISUSER=default)
        String username = firstNonBlank(environment, "REDIS_USERNAME", "REDIS_USER", "REDISUSER");
        if (username != null && !StringUtils.hasText(environment.getProperty("spring.data.redis.username"))) {
            extras.put("spring.data.redis.username", username);
        }

        if (!extras.isEmpty()) {
            environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, extras));
        }
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
