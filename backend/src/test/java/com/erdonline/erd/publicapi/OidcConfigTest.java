package com.erdonline.erd.publicapi;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Issuer 解析：CORS 允许多 Origin（{@link com.erdonline.config.CrossOriginPolicyTest}），
 * 但 OIDC issuer/JWKS {@code iss} 须单值 —— 多源 CSV 取第一个合法 http(s) 条目，跳过畸形值。
 */
class OidcConfigTest {

    @Test
    void explicitIssuerWinsOverUiUrl() {
        OidcProperties props = new OidcProperties();
        props.setIssuer("http://127.0.0.1:9502/");
        assertEquals("http://127.0.0.1:9502",
                OidcConfig.resolveIssuer(props, "https://app.erdonline.com", null));
    }

    @Test
    void csvUiUrlPicksFirstEntryAsIssuer() {
        OidcProperties props = new OidcProperties();
        assertEquals("https://app.erdonline.com",
                OidcConfig.resolveIssuer(
                        props, "https://app.erdonline.com,https://www.erdonline.com", null));
    }

    @Test
    void csvUiUrlSkipsMalformedFirstEntry() {
        OidcProperties props = new OidcProperties();
        assertEquals("https://www.erdonline.com",
                OidcConfig.resolveIssuer(
                        props, "ttps://app.erdonline.com,https://www.erdonline.com", null));
    }

    @Test
    void nonProdFallsBackToLocalhostWhenNothingValid() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        OidcProperties props = new OidcProperties();
        assertEquals("http://localhost:8000",
                OidcConfig.resolveIssuer(props, "ttps://typo-only.example", env));
    }

    @Test
    void prodFailsFastWhenNoValidIssuerCandidate() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        OidcProperties props = new OidcProperties();
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> OidcConfig.resolveIssuer(props, "ttps://typo-only.example", env));
        assertTrue(ex.getMessage().contains("ERD_OIDC_ISSUER"));
        assertTrue(ex.getMessage().contains("ERD_UI_URL"));
    }

    @Test
    void nullMartinUiUrlWithNullEnvFallsBackToLocalhost() {
        OidcProperties props = new OidcProperties();
        assertEquals("http://localhost:8000", OidcConfig.resolveIssuer(props, null, null));
    }
}
