package com.erdonline.config;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.data.redis.RedisProperties;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.mock.env.MockEnvironment;

/**
 * Ensures REDIS_* placeholders land on Boot 3 {@code spring.data.redis.*} (what Redisson reads).
 */
class RedisDataPropertiesBindingTest {

    @Test
    void redisHostPlaceholderBindsUnderSpringDataRedis() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("REDIS_HOST", "redis.railway.internal");
        env.setProperty("REDIS_PORT", "6379");
        env.setProperty("REDIS_PASSWORD", "s3cret");
        env.setProperty("spring.data.redis.host", "${REDIS_HOST:${REDISHOST:localhost}}");
        env.setProperty("spring.data.redis.port", "${REDIS_PORT:${REDISPORT:6379}}");
        env.setProperty("spring.data.redis.password", "${REDIS_PASSWORD:${REDISPASSWORD:}}");

        RedisProperties props = Binder.get(env)
                .bind("spring.data.redis", Bindable.of(RedisProperties.class))
                .get();

        assertEquals("redis.railway.internal", props.getHost());
        assertEquals(6379, props.getPort());
        assertEquals("s3cret", props.getPassword());
    }

    @Test
    void railwayPluginNamesFallbackWhenRedisUnderscoreUnset() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("REDISHOST", "plugin-host");
        env.setProperty("REDISPORT", "6380");
        env.setProperty("REDISPASSWORD", "plugin-pass");
        env.setProperty("spring.data.redis.host", "${REDIS_HOST:${REDISHOST:localhost}}");
        env.setProperty("spring.data.redis.port", "${REDIS_PORT:${REDISPORT:6379}}");
        env.setProperty("spring.data.redis.password", "${REDIS_PASSWORD:${REDISPASSWORD:}}");

        RedisProperties props = Binder.get(env)
                .bind("spring.data.redis", Bindable.of(RedisProperties.class))
                .get();

        assertEquals("plugin-host", props.getHost());
        assertEquals(6380, props.getPort());
        assertEquals("plugin-pass", props.getPassword());
    }

    @Test
    void defaultsRemainLocalhostWhenUnset() {
        StandardEnvironment env = new StandardEnvironment();
        env.getPropertySources().addFirst(new org.springframework.core.env.MapPropertySource(
                "defaults",
                java.util.Map.of(
                        "spring.data.redis.host", "${REDIS_HOST:${REDISHOST:localhost}}",
                        "spring.data.redis.port", "${REDIS_PORT:${REDISPORT:6379}}")));

        RedisProperties props = Binder.get(env)
                .bind("spring.data.redis", Bindable.of(RedisProperties.class))
                .get();

        assertEquals("localhost", props.getHost());
        assertEquals(6379, props.getPort());
    }

    @Test
    void deprecatedSpringRedisPrefixDoesNotFeedRedisProperties() {
        // Regression lock: Boot 3 error-deprecates spring.redis.* — must not silently bind.
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
