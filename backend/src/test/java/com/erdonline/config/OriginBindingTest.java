package com.erdonline.config;

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
 * R-CFG-04：prod SocketIO/UI origin 占位符无默认；dev 保留 * / localhost。
 */
class OriginBindingTest {

    @Test
    void prodRequiredPlaceholderFailsWhenNeitherOriginEnvSet() {
        MockEnvironment env = new MockEnvironment();
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> env.resolveRequiredPlaceholders("${SOCKETIO_ORIGIN:${ERD_UI_URL}}"));
        assertTrue(ex.getMessage().contains("ERD_UI_URL") || ex.getMessage().contains("SOCKETIO_ORIGIN"));
    }

    @Test
    void prodOriginBindsFromErdUiUrlWhenSocketIoUnset() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("ERD_UI_URL", "https://erdonline-demo.pages.dev");
        env.setProperty("martin.socketio.origin", "${SOCKETIO_ORIGIN:${ERD_UI_URL}}");
        env.setProperty("martin.ui.url", "${ERD_UI_URL:${SOCKETIO_ORIGIN}}");

        Binder binder = new Binder(
                ConfigurationPropertySources.get(env),
                new PropertySourcesPlaceholdersResolver(env));
        assertEquals("https://erdonline-demo.pages.dev",
                binder.bind("martin.socketio.origin", Bindable.of(String.class)).get());
        assertEquals("https://erdonline-demo.pages.dev",
                binder.bind("martin.ui.url", Bindable.of(String.class)).get());
    }

    @Test
    void prodOriginPrefersSocketIoOrigin() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("SOCKETIO_ORIGIN", "https://ws-ui.example");
        env.setProperty("ERD_UI_URL", "https://pages.example");
        env.setProperty("martin.socketio.origin", "${SOCKETIO_ORIGIN:${ERD_UI_URL}}");

        String origin = new Binder(
                ConfigurationPropertySources.get(env),
                new PropertySourcesPlaceholdersResolver(env))
                .bind("martin.socketio.origin", Bindable.of(String.class))
                .get();
        assertEquals("https://ws-ui.example", origin);
    }

    @Test
    void localDefaultKeepsWildcardPlaceholder() {
        StandardEnvironment env = new StandardEnvironment();
        env.getPropertySources().addFirst(new MapPropertySource(
                "socketio-local",
                Map.of("martin.socketio.origin", "${SOCKETIO_ORIGIN:*}")));

        String origin = new Binder(
                ConfigurationPropertySources.get(env),
                new PropertySourcesPlaceholdersResolver(env))
                .bind("martin.socketio.origin", Bindable.of(String.class))
                .get();
        assertEquals("*", origin);
    }
}
