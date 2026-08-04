package com.erdonline.erd.publicapi;

import com.erdonline.erd.entity.OAuthAccessToken;
import org.junit.jupiter.api.Test;

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

        assertTrue(OAuthClientCodec.looksLikeClientId(clientId));
        assertTrue(secret.startsWith(OAuthClientCodec.CLIENT_SECRET_PREFIX));
        assertTrue(OAuthClientCodec.looksLikeAccessToken(oat));
        assertFalse(PatTokenCodec.looksLikePat(oat));

        String hash = OAuthClientCodec.hash(secret);
        assertEquals(64, hash.length());
        assertEquals(hash, OAuthClientCodec.hash(secret));
        assertFalse(hash.equals(secret));
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
}
