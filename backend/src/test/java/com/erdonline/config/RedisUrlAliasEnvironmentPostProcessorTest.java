package com.erdonline.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.mock.env.MockEnvironment;

class RedisUrlAliasEnvironmentPostProcessorTest {

    private final RedisUrlAliasEnvironmentPostProcessor processor = new RedisUrlAliasEnvironmentPostProcessor();
    private final SpringApplication application = new SpringApplication();

    @Test
    void mapsRedisUrlToSpringDataRedisUrl() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("REDIS_URL", "redis://:secret@redis.railway.internal:6379");

        processor.postProcessEnvironment(env, application);

        assertEquals(
                "redis://:secret@redis.railway.internal:6379",
                env.getProperty("spring.data.redis.url"));
        assertEquals(
                RedisUrlAliasEnvironmentPostProcessor.PROPERTY_SOURCE_NAME,
                env.getPropertySources().iterator().next().getName());
    }

    @Test
    void doesNotOverrideExplicitSpringDataRedisUrl() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("spring.data.redis.url", "redis://explicit:6379");
        env.setProperty("REDIS_URL", "redis://:secret@other:6379");

        processor.postProcessEnvironment(env, application);

        assertEquals("redis://explicit:6379", env.getProperty("spring.data.redis.url"));
        assertFalse(env.getPropertySources().contains(RedisUrlAliasEnvironmentPostProcessor.PROPERTY_SOURCE_NAME));
    }

    @Test
    void ignoresBlankRedisUrl() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("REDIS_URL", "   ");

        processor.postProcessEnvironment(env, application);

        assertNull(env.getProperty("spring.data.redis.url"));
        assertFalse(env.getPropertySources().contains(RedisUrlAliasEnvironmentPostProcessor.PROPERTY_SOURCE_NAME));
    }

    @Test
    void noOpWhenNoRedisUrl() {
        MockEnvironment env = new MockEnvironment();
        Map<String, Object> before = new HashMap<>();
        env.getPropertySources().forEach(ps -> before.put(ps.getName(), Boolean.TRUE));

        processor.postProcessEnvironment(env, application);

        assertFalse(env.getPropertySources().contains(RedisUrlAliasEnvironmentPostProcessor.PROPERTY_SOURCE_NAME));
        assertEquals(before.size(), env.getPropertySources().size());
    }
}
