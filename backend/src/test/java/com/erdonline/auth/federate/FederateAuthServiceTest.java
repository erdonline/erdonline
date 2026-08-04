package com.erdonline.auth.federate;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FederateAuthServiceTest {

    @Test
    void sanitizeRedirect_acceptsRelativePaths() {
        assertEquals("/home", FederateAuthService.sanitizeRedirect("/home"));
        assertEquals("/oauth/authorize?x=1", FederateAuthService.sanitizeRedirect("/oauth/authorize?x=1"));
    }

    @Test
    void sanitizeRedirect_rejectsOpenRedirect() {
        assertNull(FederateAuthService.sanitizeRedirect("https://evil.example/phish"));
        assertNull(FederateAuthService.sanitizeRedirect("//evil.example"));
        assertNull(FederateAuthService.sanitizeRedirect("\\\\evil"));
        assertNull(FederateAuthService.sanitizeRedirect("home"));
        assertNull(FederateAuthService.sanitizeRedirect(null));
        assertNull(FederateAuthService.sanitizeRedirect("  "));
    }

    @Test
    void propertiesDisabledWithoutCredentials() {
        FederateProperties p = new FederateProperties();
        assertFalse(p.isGithubEnabled());
        assertFalse(p.isGoogleEnabled());
        assertFalse(p.isWechatEnabled());
        p.getGoogle().setClientId("id");
        p.getGoogle().setClientSecret("secret");
        assertFalse(p.isGoogleEnabled());
        p.getGoogle().setRedirectUri("http://localhost:9502/auth/federate/google/callback");
        assertTrue(p.isGoogleEnabled());
        p.getGithub().setClientId("gh");
        p.getGithub().setClientSecret("sec");
        assertFalse(p.isGithubEnabled());
        p.getGithub().setRedirectUri("http://localhost:9502/auth/federate/github/callback");
        assertTrue(p.isGithubEnabled());
        assertTrue(p.isEnabled(FederateProvider.GITHUB));
    }

    @Test
    void providerWireRoundTrip() {
        assertEquals(FederateProvider.GOOGLE, FederateProvider.fromWire("Google"));
        assertEquals(FederateProvider.GITHUB, FederateProvider.fromWire("github"));
        assertEquals("wechat", FederateProvider.WECHAT.wire());
    }
}
