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
 * Bridges PaaS connection URLs into {@code spring.data.redis.*} before binding.
 *
 * <p>Railway Redis exposes {@code REDIS_URL} ({@code redis://:pass@host:port}); Boot 3 / Redisson
 * only honor {@code spring.data.redis.url} (or host/port/password). Empty defaults must not be
 * written into YAML ({@code url: ${REDIS_URL:}} would bind {@code ""} and break URI parsing).
 */
public class RedisUrlAliasEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    static final String PROPERTY_SOURCE_NAME = "erdRedisUrlAlias";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> extras = new LinkedHashMap<>(4);

        if (!StringUtils.hasText(environment.getProperty("spring.data.redis.url"))) {
            String redisUrl = firstNonBlank(environment, "REDIS_URL", "REDISURL");
            if (redisUrl != null) {
                extras.put("spring.data.redis.url", redisUrl);
            }
        }

        // Optional: if only Railway plugin names exist (no REDIS_HOST), surface them for YAML
        // placeholders that already prefer REDIS_* then REDISHOST — this is a safety net when
        // someone sets only SPRING_DATA_REDIS_* via references.
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
