package com.erdonline.erd.publicapi;

import com.erdonline.erd.entity.OAuthAccessToken;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OAuthClientCodecTest {

    @Test
    void generateAndHash_neverEqualsPlaintext() {
        String clientId = OAuthClientCodec.generateClientId();
        String secret = OAuthClientCodec.generateClientSecret();
        String oat = OAuthClientCodec.generateAccessToken();
        String ort = OAuthClientCodec.generateRefreshToken();
        String code = OAuthClientCodec.generateAuthorizationCode();

        assertTrue(OAuthClientCodec.looksLikeClientId(clientId));
        assertTrue(secret.startsWith(OAuthClientCodec.CLIENT_SECRET_PREFIX));
        assertTrue(OAuthClientCodec.looksLikeAccessToken(oat));
        assertTrue(OAuthClientCodec.looksLikeRefreshToken(ort));
        assertTrue(ort.startsWith(OAuthClientCodec.REFRESH_TOKEN_PREFIX));
        assertTrue(OAuthClientCodec.looksLikeAuthorizationCode(code));
        assertTrue(code.startsWith(OAuthClientCodec.AUTH_CODE_PREFIX));
        assertFalse(PatTokenCodec.looksLikePat(oat));
        assertFalse(OAuthClientCodec.looksLikeAccessToken(ort));
        assertFalse(OAuthClientCodec.looksLikeRefreshToken(oat));

        String hash = OAuthClientCodec.hash(secret);
        assertEquals(64, hash.length());
        assertEquals(hash, OAuthClientCodec.hash(secret));
        assertFalse(hash.equals(secret));
        assertTrue(OAuthClientCodec.hashEquals(hash, OAuthClientCodec.hash(secret)));
        assertFalse(OAuthClientCodec.hashEquals(hash, OAuthClientCodec.hash(oat)));
        assertEquals(64, OAuthClientCodec.hash(ort).length());
        assertFalse(OAuthClientCodec.hash(ort).equals(ort));
    }

    @Test
    void hint_showsLastFour() {
        assertEquals("…cdef", OAuthClientCodec.hint("aabbccddeeffcdef"));
    }

    @Test
    void toAuthenticatedOat_mapsScopesWithoutPlaintext() {
        String plain = OAuthClientCodec.generateAccessToken();
        OAuthAccessToken row = new OAuthAccessToken();
        row.setId("oat1");
        row.setUserId("u1");
        row.setUsername("alice");
        row.setTokenHash(OAuthClientCodec.hash(plain));
        row.setScopes(PatScopes.toCsv(PatScopes.DEFAULT_READ));
        row.setRevoked("0");

        OAuthApiClientService.AuthenticatedOat auth = OAuthApiClientServiceImpl.toAuthenticatedOat(row);
        assertEquals("alice", auth.user().getUsername());
        assertEquals("u1", auth.user().getId());
        assertEquals("oat1", auth.tokenId());
        assertTrue(auth.scopes().contains(PatScopes.PROJECTS_READ));
        assertFalse(row.getTokenHash().equals(plain));
    }

    @Test
    void resolveRequestedScopes_subsetOrDefault() {
        Set<String> allowed = Set.of(PatScopes.PROJECTS_READ, PatScopes.VERSIONS_READ, PatScopes.PROJECTS_WRITE);
        assertEquals(allowed, OAuthApiClientServiceImpl.resolveRequestedScopes(allowed, null));
        assertEquals(Set.of(PatScopes.PROJECTS_READ),
                OAuthApiClientServiceImpl.resolveRequestedScopes(allowed, "projects:read"));
        assertThrows(IllegalArgumentException.class,
                () -> OAuthApiClientServiceImpl.resolveRequestedScopes(allowed, "versions:write"));
    }

    @Test
    void parseBasic_decodesClientCredentials() {
        String raw = java.util.Base64.getEncoder().encodeToString("erd_cli_ab:erd_cs_cd".getBytes());
        String[] pair = OAuthTokenController.parseBasic("Basic " + raw);
        assertEquals("erd_cli_ab", pair[0]);
        assertEquals("erd_cs_cd", pair[1]);
    }

    @Test
    void pkceS256_roundTrip() {
        String verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
        String challenge = OAuthClientCodec.s256Challenge(verifier);
        assertTrue(OAuthClientCodec.isValidCodeChallenge(challenge));
        assertTrue(OAuthClientCodec.verifyPkceS256(verifier, challenge));
        assertFalse(OAuthClientCodec.verifyPkceS256(verifier + "x", challenge));
        assertFalse(OAuthClientCodec.isValidCodeVerifier("too-short"));
    }

    @Test
    void redirectUri_exactMatchAndShape() {
        String stored = OAuthClientCodec.joinRedirectUris(List.of(
                "https://app.example.com/cb",
                "http://127.0.0.1:3000/oauth/cb"));
        assertTrue(OAuthClientCodec.redirectUriAllowed(stored, "https://app.example.com/cb"));
        assertFalse(OAuthClientCodec.redirectUriAllowed(stored, "https://app.example.com/cb/"));
        assertFalse(OAuthClientCodec.redirectUriAllowed(stored, "https://evil.example/cb"));
        assertThrows(IllegalArgumentException.class,
                () -> OAuthClientCodec.validateRedirectUriShape("http://evil.example/cb"));
        assertThrows(IllegalArgumentException.class,
                () -> OAuthClientCodec.validateRedirectUriShape("https://app.example.com/cb#frag"));
        OAuthClientCodec.validateRedirectUriShape("http://localhost:8080/cb");
    }

    @Test
    void appendQuery_preservesExistingParams() {
        var uri = OAuthAuthorizeController.appendQuery(
                "http://127.0.0.1:3000/cb?x=1", "code", "erd_ac_ab", "state", "s1");
        assertTrue(uri.toString().contains("x=1"));
        assertTrue(uri.toString().contains("code=erd_ac_ab"));
        assertTrue(uri.toString().contains("state=s1"));
    }

    @Test
    void redirectHost_includesExplicitPort() {
        assertEquals("127.0.0.1:3000",
                OAuthClientCodec.redirectHost("http://127.0.0.1:3000/cb"));
        assertEquals("app.example.com",
                OAuthClientCodec.redirectHost("https://app.example.com/oauth/cb"));
        assertEquals("", OAuthClientCodec.redirectHost(""));
    }

    @Test
    void acceptsJson_detectsApplicationJson() {
        assertTrue(OAuthAuthorizeController.acceptsJson("application/json"));
        assertTrue(OAuthAuthorizeController.acceptsJson("application/json, text/plain"));
        assertFalse(OAuthAuthorizeController.acceptsJson("*/*"));
        assertFalse(OAuthAuthorizeController.acceptsJson(null));
        assertFalse(OAuthAuthorizeController.acceptsJson("text/html"));
    }

    @Test
    void normalizeClientType() {
        assertEquals("confidential", OAuthClientCodec.normalizeClientType(null));
        assertEquals("public", OAuthClientCodec.normalizeClientType("PUBLIC"));
        assertThrows(IllegalArgumentException.class, () -> OAuthClientCodec.normalizeClientType("spa"));
    }
}
