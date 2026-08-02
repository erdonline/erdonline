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
    void prefersPrivateUrlOverPublicRedisUrl() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("REDIS_URL", "redis://:pub@public.example:6379");
        env.setProperty("REDIS_PRIVATE_URL", "redis://default:secret@redis.railway.internal:6379");

        processor.postProcessEnvironment(env, application);

        assertEquals(
                "redis://default:secret@redis.railway.internal:6379",
                env.getProperty("spring.data.redis.url"));
    }

    @Test
    void injectsPasswordAndAclUsernameWhenSet() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("REDIS_PASSWORD", "s3cret");
        env.setProperty("REDISUSER", "default");

        processor.postProcessEnvironment(env, application);

        assertEquals("s3cret", env.getProperty("spring.data.redis.password"));
        assertEquals("default", env.getProperty("spring.data.redis.username"));
    }

    @Test
    void fallsBackToPluginPasswordName() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("REDISPASSWORD", "plugin-pass");

        processor.postProcessEnvironment(env, application);

        assertEquals("plugin-pass", env.getProperty("spring.data.redis.password"));
    }

    @Test
    void doesNotInjectBlankPasswordOrUsername() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("REDIS_PASSWORD", "   ");
        env.setProperty("REDISUSER", "");

        processor.postProcessEnvironment(env, application);

        assertNull(env.getProperty("spring.data.redis.password"));
        assertNull(env.getProperty("spring.data.redis.username"));
        assertFalse(env.getPropertySources().contains(RedisUrlAliasEnvironmentPostProcessor.PROPERTY_SOURCE_NAME));
    }

    @Test
    void doesNotOverrideExplicitSpringDataRedisUrl() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("spring.data.redis.url", "redis://explicit:6379");
        env.setProperty("REDIS_URL", "redis://:secret@other:6379");

        processor.postProcessEnvironment(env, application);

        assertEquals("redis://explicit:6379", env.getProperty("spring.data.redis.url"));
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
    void noOpWhenNoRedisEnv() {
        MockEnvironment env = new MockEnvironment();
        Map<String, Object> before = new HashMap<>();
        env.getPropertySources().forEach(ps -> before.put(ps.getName(), Boolean.TRUE));

        processor.postProcessEnvironment(env, application);

        assertFalse(env.getPropertySources().contains(RedisUrlAliasEnvironmentPostProcessor.PROPERTY_SOURCE_NAME));
        assertEquals(before.size(), env.getPropertySources().size());
    }
}
