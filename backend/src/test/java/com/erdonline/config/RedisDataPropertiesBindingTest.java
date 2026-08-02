package com.erdonline.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.data.redis.RedisProperties;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.mock.env.MockEnvironment;

/**
 * Ensures Railway plugin names ({@code REDISHOST} …) and local {@code REDIS_HOST}
 * bind under Boot 3 {@code spring.data.redis.*} (what Redisson reads).
 */
class RedisDataPropertiesBindingTest {

    @Test
    void railwayPluginHostBindsPrimarily() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("REDISHOST", "redis.railway.internal");
        env.setProperty("REDISPORT", "6379");
        env.setProperty("spring.data.redis.host", "${REDISHOST:${REDIS_HOST:localhost}}");
        env.setProperty("spring.data.redis.port", "${REDISPORT:${REDIS_PORT:6379}}");
        env.setProperty("spring.data.redis.password", "s3cret");
        env.setProperty("spring.data.redis.username", "default");

        RedisProperties props = Binder.get(env)
                .bind("spring.data.redis", Bindable.of(RedisProperties.class))
                .get();

        assertEquals("redis.railway.internal", props.getHost());
        assertEquals(6379, props.getPort());
        assertEquals("s3cret", props.getPassword());
        assertEquals("default", props.getUsername());
    }

    @Test
    void localRedisHostFallbackWhenPluginNameUnset() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("REDIS_HOST", "redis");
        env.setProperty("REDIS_PORT", "6379");
        env.setProperty("spring.data.redis.host", "${REDISHOST:${REDIS_HOST:localhost}}");
        env.setProperty("spring.data.redis.port", "${REDISPORT:${REDIS_PORT:6379}}");

        RedisProperties props = Binder.get(env)
                .bind("spring.data.redis", Bindable.of(RedisProperties.class))
                .get();

        assertEquals("redis", props.getHost());
        assertEquals(6379, props.getPort());
    }

    @Test
    void pluginNameWinsOverLocalAliasWhenBothSet() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("REDISHOST", "plugin-host");
        env.setProperty("REDIS_HOST", "local-alias");
        env.setProperty("spring.data.redis.host", "${REDISHOST:${REDIS_HOST:localhost}}");

        RedisProperties props = Binder.get(env)
                .bind("spring.data.redis", Bindable.of(RedisProperties.class))
                .get();

        assertEquals("plugin-host", props.getHost());
    }

    @Test
    void defaultsRemainLocalhostWithNullAuthWhenUnset() {
        StandardEnvironment env = new StandardEnvironment();
        env.getPropertySources().addFirst(new org.springframework.core.env.MapPropertySource(
                "defaults",
                java.util.Map.of(
                        "spring.data.redis.host", "${REDISHOST:${REDIS_HOST:localhost}}",
                        "spring.data.redis.port", "${REDISPORT:${REDIS_PORT:6379}}")));

        RedisProperties props = Binder.get(env)
                .bind("spring.data.redis", Bindable.of(RedisProperties.class))
                .get();

        assertEquals("localhost", props.getHost());
        assertEquals(6379, props.getPort());
        assertNull(props.getPassword(), "empty-string password would make Redisson AUTH \"\"");
        assertNull(props.getUsername(), "empty-string username would make Redisson AUTH \"\" pass → WRONGPASS");
    }

    @Test
    void deprecatedSpringRedisPrefixDoesNotFeedRedisProperties() {
        new ApplicationContextRunner()
                .withPropertyValues(
                        "spring.redis.host=should-be-ignored",
                        "spring.redis.port=6381")
                .withBean(RedisProperties.class)
                .run(ctx -> {
                    RedisProperties props = ctx.getBean(RedisProperties.class);
                    assertEquals("localhost", props.getHost());
                    assertEquals(6379, props.getPort());
                });
    }
}
