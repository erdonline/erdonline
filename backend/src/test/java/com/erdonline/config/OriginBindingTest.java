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
 * R-CFG-04：prod SocketIO/UI origin 仅 {@code ERD_UI_URL}；dev 保留 * / localhost。
 */
class OriginBindingTest {

    @Test
    void prodRequiredPlaceholderFailsWhenErdUiUrlUnset() {
        MockEnvironment env = new MockEnvironment();
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> env.resolveRequiredPlaceholders("${ERD_UI_URL}"));
        assertTrue(ex.getMessage().contains("ERD_UI_URL"));
    }

    @Test
    void prodOriginBindsSocketIoAndUiFromErdUiUrl() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("ERD_UI_URL", "https://www.erdonline.com");
        env.setProperty("martin.socketio.origin", "${ERD_UI_URL}");
        env.setProperty("martin.ui.url", "${ERD_UI_URL}");

        Binder binder = new Binder(
                ConfigurationPropertySources.get(env),
                new PropertySourcesPlaceholdersResolver(env));
        assertEquals("https://www.erdonline.com",
                binder.bind("martin.socketio.origin", Bindable.of(String.class)).get());
        assertEquals("https://www.erdonline.com",
                binder.bind("martin.ui.url", Bindable.of(String.class)).get());
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
