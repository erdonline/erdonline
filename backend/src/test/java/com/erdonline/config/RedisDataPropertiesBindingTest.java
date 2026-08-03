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
 * Railway-native Redis placeholders: {@code REDISHOST}/{@code REDISPORT}/
 * {@code REDISUSER}/{@code REDISPASSWORD}（单变量、无嵌套回退）。
 */
class RedisDataPropertiesBindingTest {

    @Test
    void railwayRedisHostEnvBindsWithPassword() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("REDISHOST", "redis.railway.internal");
        env.setProperty("REDISPORT", "6379");
        env.setProperty("REDISUSER", "default");
        env.setProperty("REDISPASSWORD", "s3cret");
        env.setProperty("spring.data.redis.host", "${REDISHOST:localhost}");
        env.setProperty("spring.data.redis.port", "${REDISPORT:6379}");
        env.setProperty("spring.data.redis.username", "${REDISUSER:}");
        env.setProperty("spring.data.redis.password", "${REDISPASSWORD:}");

        RedisProperties props = Binder.get(env)
                .bind("spring.data.redis", Bindable.of(RedisProperties.class))
                .get();

        assertEquals("redis.railway.internal", props.getHost());
        assertEquals(6379, props.getPort());
        assertEquals("default", props.getUsername());
        assertEquals("s3cret", props.getPassword());
        assertNull(props.getUrl());
    }

    @Test
    void defaultsRemainLocalhostWithNullAuthWhenUnset() {
        StandardEnvironment env = new StandardEnvironment();
        env.getPropertySources().addFirst(new org.springframework.core.env.MapPropertySource(
                "defaults",
                java.util.Map.of(
                        "spring.data.redis.host", "${REDISHOST:localhost}",
                        "spring.data.redis.port", "${REDISPORT:6379}")));

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
    void blankCredentialNormalizerNullsEmptyStrings() {
        RedisProperties props = new RedisProperties();
        props.setUsername("");
        props.setPassword("");
        RedisBlankCredentialNormalizer.sanitize(props);
        assertNull(props.getPassword());
        assertNull(props.getUsername());
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
    void railwayPluginNamesAreNotSpringLooseBinding() {
        // REDISHOST ≠ SPRING_DATA_REDIS_HOST；必须靠 yml 占位符显式映射
        assertTrue(!"REDISHOST".equals("spring.data.redis.host".toUpperCase().replace('.', '_')));
        assertTrue("SPRING_DATA_REDIS_HOST"
                .equals("spring.data.redis.host".toUpperCase().replace('.', '_')));
    }
}
