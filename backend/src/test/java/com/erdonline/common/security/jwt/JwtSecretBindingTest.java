package com.erdonline.common.security.jwt;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.bind.PropertySourcesPlaceholdersResolver;
import org.springframework.boot.context.properties.source.ConfigurationPropertySources;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.mock.env.MockEnvironment;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * R-CFG-01：prod 占位符无默认；dev 保留弱默认。
 */
class JwtSecretBindingTest {

    @Test
    void prodRequiredPlaceholderFailsWhenJwtSecretUnset() {
        // 对齐 Boot：application-prod.yml 的 ${JWT_SECRET} 无默认 → resolveRequiredPlaceholders 失败
        MockEnvironment env = new MockEnvironment();
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> env.resolveRequiredPlaceholders("${JWT_SECRET}"));
        assertTrue(ex.getMessage().contains("JWT_SECRET"));
    }

    @Test
    void prodPlaceholderBindsWhenJwtSecretSet() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("JWT_SECRET", "prod-random-jwt-secret-at-least-32b!!");
        env.setProperty("erd.jwt.secret", "${JWT_SECRET}");

        JwtProperties props = new Binder(
                ConfigurationPropertySources.get(env),
                new PropertySourcesPlaceholdersResolver(env))
                .bind("erd.jwt", Bindable.of(JwtProperties.class))
                .get();
        assertEquals("prod-random-jwt-secret-at-least-32b!!", props.getSecret());
    }

    @Test
    void localDefaultKeepsDevPlaceholder() {
        StandardEnvironment env = new StandardEnvironment();
        env.getPropertySources().addFirst(new MapPropertySource(
                "jwt-local",
                Map.of("erd.jwt.secret",
                        "${JWT_SECRET:erd-online-dev-jwt-secret-change-me-32bytes!!}")));

        JwtProperties props = new Binder(
                ConfigurationPropertySources.get(env),
                new PropertySourcesPlaceholdersResolver(env))
                .bind("erd.jwt", Bindable.of(JwtProperties.class))
                .get();
        assertEquals(JwtProperties.INSECURE_DEV_DEFAULT, props.getSecret());
    }
}
