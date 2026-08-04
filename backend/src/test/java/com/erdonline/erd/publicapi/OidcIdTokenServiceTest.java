package com.erdonline.erd.publicapi;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import com.nimbusds.jose.jwk.source.ImmutableSecret;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
class OidcIdTokenServiceTest {

    private OidcIdTokenService service;
    private OidcProperties props;

    @BeforeEach
    void setUp() {
        props = new OidcProperties();
        props.setIssuer("http://127.0.0.1:9502");
        props.setHmacSecret("unit-test-oidc-hmac-secret-32bytes!!");
        props.setIdTokenTtlSeconds(600L);
        SecretKey key = new SecretKeySpec(
                props.getHmacSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        JwtEncoder encoder = new NimbusJwtEncoder(new ImmutableSecret<>(key));
        JwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
        service = new OidcIdTokenService(encoder, decoder, props, "http://localhost:8000");
    }

    @Test
    void mintIfOpenid_skipsWithoutScope() {
        assertNull(service.mintIfOpenid(
                Set.of(PatScopes.PROJECTS_READ), "erd_cli_x", "u1", "alice", null, "erd_oat_x"));
    }

    @Test
    void mintIfOpenid_issuesHs256WithClaims() {
        String access = "erd_oat_abcdefghijklmnopqrstuvwxyz012345";
        String jwt = service.mintIfOpenid(
                Set.of(PatScopes.OPENID, PatScopes.PROJECTS_READ),
                "erd_cli_audience01", "user-42", "alice", "n-authz-1", access);
        assertNotNull(jwt);
        Jwt decoded = service.decode(jwt);
        assertEquals("user-42", decoded.getSubject());
        assertEquals("http://127.0.0.1:9502", decoded.getIssuer().toString());
        assertTrue(decoded.getAudience().contains("erd_cli_audience01"));
        assertEquals("alice", decoded.getClaimAsString("preferred_username"));
        assertEquals("n-authz-1", decoded.getClaimAsString("nonce"));
        assertEquals(OidcIdTokenService.atHashHs256(access), decoded.getClaimAsString("at_hash"));
        assertEquals(MacAlgorithm.HS256.getName(), decoded.getHeaders().get("alg"));
    }

    @Test
    void mintIfOpenid_refreshOmitsNonceButKeepsAtHash() {
        String access = "erd_oat_refreshpath_access_token_value";
        String jwt = service.mintIfOpenid(
                Set.of(PatScopes.OPENID),
                "erd_cli_audience01", "user-42", "alice", null, access);
        assertNotNull(jwt);
        Jwt decoded = service.decode(jwt);
        assertFalse(decoded.hasClaim("nonce"));
        assertEquals(OidcIdTokenService.atHashHs256(access), decoded.getClaimAsString("at_hash"));
    }

    @Test
    void atHashHs256_leftHalfSha256Base64Url() {
        // RFC / OIDC: SHA-256(ascii) left 128 bits → base64url no pad
        String known = "access_token_value_for_hash_test";
        String hash = OidcIdTokenService.atHashHs256(known);
        assertEquals(22, hash.length()); // 16 bytes → 22 chars without padding
        assertTrue(hash.matches("^[A-Za-z0-9_-]+$"));
        assertEquals(hash, OidcIdTokenService.atHashHs256(known));
    }

    @Test
    void normalizeNonce_rejectsOverlong() {
        assertNull(OidcIdTokenService.normalizeNonce(null));
        assertNull(OidcIdTokenService.normalizeNonce("  "));
        assertEquals("abc", OidcIdTokenService.normalizeNonce(" abc "));
        String tooLong = "x".repeat(OidcIdTokenService.NONCE_MAX_LEN + 1);
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> OidcIdTokenService.normalizeNonce(tooLong));
        assertEquals("invalid_request:nonce", ex.getMessage());
    }

    @Test
    void userInfoClaims_shape() {
        Map<String, Object> claims = service.userInfoClaims("uid", "bob");
        assertEquals("uid", claims.get("sub"));
        assertEquals("bob", claims.get("preferred_username"));
        assertEquals("bob", claims.get("name"));
    }

    @Test
    void issuerFallsBackToUiUrlWhenUnset() {
        props.setIssuer("");
        SecretKey key = new SecretKeySpec(
                props.getHmacSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        OidcIdTokenService s = new OidcIdTokenService(
                new NimbusJwtEncoder(new ImmutableSecret<>(key)),
                NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build(),
                props,
                "https://app.erdonline.com");
        assertEquals("https://app.erdonline.com", s.issuer());
    }

    @Test
    void prodRejectsDevDefaultHmac() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        assertThrows(IllegalStateException.class,
                () -> OidcConfig.assertHmacSafeForProfile(OidcProperties.INSECURE_DEV_DEFAULT, env));
        assertThrows(IllegalStateException.class,
                () -> OidcConfig.assertHmacSafeForProfile("  ", env));
    }

    @Test
    void nonProdAllowsDevDefaultHmac() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        OidcConfig.assertHmacSafeForProfile(OidcProperties.INSECURE_DEV_DEFAULT, env);
    }
}
