package com.erdonline.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.data.redis.RedisProperties;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.mock.env.MockEnvironment;

/**
 * Standard Boot 3 binding for Redisson: {@code spring.data.redis.*} /
 * env {@code SPRING_DATA_REDIS_URL} (not PaaS alias spaghetti).
 */
class RedisDataPropertiesBindingTest {

    @Test
    void springDataRedisUrlBindsAndOverridesHostSemantics() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty(
                "spring.data.redis.url", "redis://default:s3cret@redis.railway.internal:6379/0");
        env.setProperty("spring.data.redis.host", "localhost");
        env.setProperty("spring.data.redis.port", "6379");

        RedisProperties props = Binder.get(env)
                .bind("spring.data.redis", Bindable.of(RedisProperties.class))
                .get();

        assertEquals("redis://default:s3cret@redis.railway.internal:6379/0", props.getUrl());
        // Boot keeps host field; connection layer prefers url (see Spring Data Redis docs)
        assertEquals("localhost", props.getHost());
    }

    @Test
    void localRedisHostEnvBindsWithoutPassword() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("REDIS_HOST", "redis");
        env.setProperty("REDIS_PORT", "6379");
        env.setProperty("spring.data.redis.host", "${REDIS_HOST:localhost}");
        env.setProperty("spring.data.redis.port", "${REDIS_PORT:6379}");

        RedisProperties props = Binder.get(env)
                .bind("spring.data.redis", Bindable.of(RedisProperties.class))
                .get();

        assertEquals("redis", props.getHost());
        assertEquals(6379, props.getPort());
        assertNull(props.getPassword());
        assertNull(props.getUrl());
    }

    @Test
    void defaultsRemainLocalhostWithNullAuthWhenUnset() {
        StandardEnvironment env = new StandardEnvironment();
        env.getPropertySources().addFirst(new org.springframework.core.env.MapPropertySource(
                "defaults",
                java.util.Map.of(
                        "spring.data.redis.host", "${REDIS_HOST:localhost}",
                        "spring.data.redis.port", "${REDIS_PORT:6379}")));

        RedisProperties props = Binder.get(env)
                .bind("spring.data.redis", Bindable.of(RedisProperties.class))
                .get();

        assertEquals("localhost", props.getHost());
        assertEquals(6379, props.getPort());
        assertNull(props.getPassword(), "empty-string password would make Redisson AUTH \"\"");
        assertNull(props.getUsername());
        assertNull(props.getUrl());
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

    @Test
    void systemEnvStyleSpringDataRedisUrlNameIsCanonical() {
        // Documents the Railway Variable name: SPRING_DATA_REDIS_URL → spring.data.redis.url
        assertTrue("SPRING_DATA_REDIS_URL"
                .equals("spring.data.redis.url".toUpperCase().replace('.', '_')));
    }
}
