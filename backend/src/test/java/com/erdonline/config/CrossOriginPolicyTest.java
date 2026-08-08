package com.erdonline.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * R-CFG-04：prod 拒 SocketIO/CORS 通配；非 prod 保留本地默认；Origin 仅 martin.ui.url。
 */
class CrossOriginPolicyTest {

    @Test
    void nonProdKeepsDevHttpDefaultsWhenUnset() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        assertEquals(
                List.of("http://localhost:8000", "http://127.0.0.1:8000"),
                CrossOriginPolicy.resolveHttpAllowedOrigins(env));
    }

    @Test
    void nonProdAllowsSocketIoWildcard() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        CrossOriginPolicy.assertSocketIoOriginSafeForProfile("*", env);
        CrossOriginPolicy.assertSocketIoOriginSafeForProfile(null, env);
    }

    @Test
    void httpOriginsFromMartinUiUrl() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("martin.ui.url", "https://pages.example");
        assertEquals(
                List.of("https://pages.example"),
                CrossOriginPolicy.resolveHttpAllowedOrigins(env));
    }

    @Test
    void httpOriginsSplitCsvFromMartinUiUrl() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("martin.ui.url", "https://demo.example, https://a.example");
        assertEquals(
                List.of("https://demo.example", "https://a.example"),
                CrossOriginPolicy.resolveHttpAllowedOrigins(env));
    }

    @Test
    void prodHttpRejectsMissingOrigins() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> CrossOriginPolicy.resolveHttpAllowedOrigins(env));
        assertTrue(ex.getMessage().contains("ERD_UI_URL"));
    }

    @Test
    void prodHttpRejectsWildcard() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("martin.ui.url", "*");
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> CrossOriginPolicy.resolveHttpAllowedOrigins(env));
        assertTrue(ex.getMessage().contains("*"));
    }

    @Test
    void prodSocketIoRejectsWildcardAndBlank() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        assertThrows(IllegalStateException.class,
                () -> CrossOriginPolicy.assertSocketIoOriginSafeForProfile("*", env));
        assertThrows(IllegalStateException.class,
                () -> CrossOriginPolicy.assertSocketIoOriginSafeForProfile("  ", env));
        assertThrows(IllegalStateException.class,
                () -> CrossOriginPolicy.assertSocketIoOriginSafeForProfile(null, env));
    }

    @Test
    void prodSocketIoAcceptsExplicitOrigin() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        CrossOriginPolicy.assertSocketIoOriginSafeForProfile("https://www.erdonline.com", env);
    }

    @Test
    void prodHttpRejectsMalformedOriginMissingScheme() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("martin.ui.url", "ttps://www.erdonline.com");
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> CrossOriginPolicy.resolveHttpAllowedOrigins(env));
        assertTrue(ex.getMessage().contains("ttps://www.erdonline.com"));
        assertTrue(ex.getMessage().contains("malformed"));
    }

    @Test
    void prodHttpRejectsMalformedOriginAmongValidCsvEntries() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("martin.ui.url", "https://app.erdonline.com,ttps://www.erdonline.com");
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> CrossOriginPolicy.resolveHttpAllowedOrigins(env));
        assertTrue(ex.getMessage().contains("ttps://www.erdonline.com"));
    }

    @Test
    void nonProdAllowsMalformedOriginWithoutThrowing() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        env.setProperty("martin.ui.url", "ttps://www.erdonline.com");
        assertEquals(
                List.of("ttps://www.erdonline.com"),
                CrossOriginPolicy.resolveHttpAllowedOrigins(env));
    }

    @Test
    void isWellFormedHttpOrigin_acceptsHttpAndHttps() {
        assertTrue(CrossOriginPolicy.isWellFormedHttpOrigin("https://app.erdonline.com"));
        assertTrue(CrossOriginPolicy.isWellFormedHttpOrigin("http://localhost:8000"));
    }

    @Test
    void isWellFormedHttpOrigin_rejectsTypoedSchemeOrBlank() {
        assertTrue(!CrossOriginPolicy.isWellFormedHttpOrigin("ttps://www.erdonline.com"));
        assertTrue(!CrossOriginPolicy.isWellFormedHttpOrigin("*"));
        assertTrue(!CrossOriginPolicy.isWellFormedHttpOrigin(""));
        assertTrue(!CrossOriginPolicy.isWellFormedHttpOrigin(null));
    }
}
