package com.erdonline.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.mock.env.MockEnvironment;

class RedisUrlAliasEnvironmentPostProcessorTest {

    private final RedisUrlAliasEnvironmentPostProcessor processor = new RedisUrlAliasEnvironmentPostProcessor();
    private final SpringApplication application = new SpringApplication();

    @Test
    void redisUrlForcesHostPortPasswordOverLocalhostDefault() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("spring.data.redis.host", "localhost");
        env.setProperty("REDIS_URL", "redis://default:s3cret@redis.railway.internal:6379/0");

        processor.postProcessEnvironment(env, application);

        assertEquals("redis://default:s3cret@redis.railway.internal:6379/0", env.getProperty("spring.data.redis.url"));
        assertEquals("redis.railway.internal", env.getProperty("spring.data.redis.host"));
        assertEquals("6379", env.getProperty("spring.data.redis.port"));
        assertEquals("default", env.getProperty("spring.data.redis.username"));
        assertEquals("s3cret", env.getProperty("spring.data.redis.password"));
        assertEquals("REDIS_URL", env.getProperty(RedisUrlAliasEnvironmentPostProcessor.RESOLVED_SOURCE_PROPERTY));
        assertEquals(
                "redis.railway.internal",
                env.getProperty(RedisUrlAliasEnvironmentPostProcessor.RESOLVED_HOST_PROPERTY));
    }

    @Test
    void prefersPrivateUrlThenRedisUrlThenPublicUrl() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("REDIS_PUBLIC_URL", "redis://:pub@public.example:6379");
        env.setProperty("REDIS_URL", "redis://default:u@redis.railway.internal:6379");
        env.setProperty("REDIS_PRIVATE_URL", "redis://default:p@private.internal:6379");

        processor.postProcessEnvironment(env, application);

        assertEquals("private.internal", env.getProperty("spring.data.redis.host"));
        assertEquals("REDIS_PRIVATE_URL", env.getProperty(RedisUrlAliasEnvironmentPostProcessor.RESOLVED_SOURCE_PROPERTY));
    }

    @Test
    void publicUrlUsedWhenOnlyPublicSet() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("REDIS_PUBLIC_URL", "redis://default:x@caboose.proxy.rlwy.net:12345");

        processor.postProcessEnvironment(env, application);

        assertEquals("caboose.proxy.rlwy.net", env.getProperty("spring.data.redis.host"));
        assertEquals("12345", env.getProperty("spring.data.redis.port"));
        assertEquals("REDIS_PUBLIC_URL", env.getProperty(RedisUrlAliasEnvironmentPostProcessor.RESOLVED_SOURCE_PROPERTY));
    }

    @Test
    void redisUrlWinsOverExplicitSpringDataRedisUrl() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("spring.data.redis.url", "redis://explicit:6379");
        env.setProperty("REDIS_URL", "redis://default:secret@other.internal:6380");

        processor.postProcessEnvironment(env, application);

        assertEquals("redis://default:secret@other.internal:6380", env.getProperty("spring.data.redis.url"));
        assertEquals("other.internal", env.getProperty("spring.data.redis.host"));
    }

    @Test
    void pluginSplitNamesInjectHostPortPasswordUser() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("REDISHOST", "redis.railway.internal");
        env.setProperty("REDISPORT", "6379");
        env.setProperty("REDISPASSWORD", "plugin-pass");
        env.setProperty("REDISUSER", "default");

        processor.postProcessEnvironment(env, application);

        assertEquals("redis.railway.internal", env.getProperty("spring.data.redis.host"));
        assertEquals("6379", env.getProperty("spring.data.redis.port"));
        assertEquals("plugin-pass", env.getProperty("spring.data.redis.password"));
        assertEquals("default", env.getProperty("spring.data.redis.username"));
        assertEquals("REDISHOST", env.getProperty(RedisUrlAliasEnvironmentPostProcessor.RESOLVED_SOURCE_PROPERTY));
    }

    @Test
    void prefersPluginPasswordNameOverUnderscore() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("REDISPASSWORD", "plugin");
        env.setProperty("REDIS_PASSWORD", "underscore");

        processor.postProcessEnvironment(env, application);

        assertEquals("plugin", env.getProperty("spring.data.redis.password"));
    }

    @Test
    void doesNotInjectBlankPasswordOrUsername() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("REDIS_PASSWORD", "   ");
        env.setProperty("REDISUSER", "");

        processor.postProcessEnvironment(env, application);

        assertNull(env.getProperty("spring.data.redis.password"));
        assertNull(env.getProperty("spring.data.redis.username"));
        assertEquals("localhost", env.getProperty(RedisUrlAliasEnvironmentPostProcessor.RESOLVED_HOST_PROPERTY));
        assertEquals("default", env.getProperty(RedisUrlAliasEnvironmentPostProcessor.RESOLVED_SOURCE_PROPERTY));
    }

    @Test
    void ignoresBlankRedisUrlFallsBackToHostEnv() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("REDIS_URL", "   ");
        env.setProperty("REDISHOST", "from-host");

        processor.postProcessEnvironment(env, application);

        assertNull(env.getProperty("spring.data.redis.url"));
        assertEquals("from-host", env.getProperty("spring.data.redis.host"));
    }

    @Test
    void alwaysRegistersDiagnosticsPropertySource() {
        MockEnvironment env = new MockEnvironment();

        processor.postProcessEnvironment(env, application);

        assertTrue(env.getPropertySources().contains(RedisUrlAliasEnvironmentPostProcessor.PROPERTY_SOURCE_NAME));
        assertEquals("localhost", env.getProperty(RedisUrlAliasEnvironmentPostProcessor.RESOLVED_HOST_PROPERTY));
    }
}
