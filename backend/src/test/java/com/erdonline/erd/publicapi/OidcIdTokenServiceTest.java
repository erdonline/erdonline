package com.erdonline.erd.publicapi;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.KeyUse;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
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
    private RSAKey rsaKey;

    @BeforeEach
    void setUp() throws Exception {
        props = new OidcProperties();
        props.setIssuer("http://127.0.0.1:9502");
        props.setIdTokenTtlSeconds(600L);
        rsaKey = new RSAKeyGenerator(2048)
                .keyUse(KeyUse.SIGNATURE)
                .keyIDFromThumbprint(true)
                .generate();
        JwtEncoder encoder = new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(rsaKey)));
        JwtDecoder decoder = NimbusJwtDecoder.withPublicKey(rsaKey.toRSAPublicKey())
                .signatureAlgorithm(SignatureAlgorithm.RS256)
                .build();
        Map<String, Object> jwks = Map.of("keys", List.of(rsaKey.toPublicJWK().toJSONObject()));
        service = new OidcIdTokenService(
                encoder, decoder, props, "http://localhost:8000", rsaKey.getKeyID(), jwks);
    }

    @Test
    void mintIfOpenid_skipsWithoutScope() {
        assertNull(service.mintIfOpenid(
                Set.of(PatScopes.PROJECTS_READ), "erd_cli_x", "u1", "alice", null, "erd_oat_x"));
    }

    @Test
    void mintIfOpenid_issuesRs256WithClaimsAndKid() {
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
        assertEquals(OidcIdTokenService.atHashRs256(access), decoded.getClaimAsString("at_hash"));
        assertEquals(SignatureAlgorithm.RS256.getName(), decoded.getHeaders().get("alg"));
        assertEquals(rsaKey.getKeyID(), decoded.getHeaders().get("kid"));
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
        assertEquals(OidcIdTokenService.atHashRs256(access), decoded.getClaimAsString("at_hash"));
    }

    @Test
    void atHashRs256_leftHalfSha256Base64Url() {
        String known = "access_token_value_for_hash_test";
        String hash = OidcIdTokenService.atHashRs256(known);
        assertEquals(22, hash.length());
        assertTrue(hash.matches("^[A-Za-z0-9_-]+$"));
        assertEquals(hash, OidcIdTokenService.atHashRs256(known));
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
    void issuerFallsBackToUiUrlWhenUnset() throws Exception {
        props.setIssuer("");
        Map<String, Object> jwks = Map.of("keys", List.of(rsaKey.toPublicJWK().toJSONObject()));
        OidcIdTokenService s = new OidcIdTokenService(
                new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(rsaKey))),
                NimbusJwtDecoder.withPublicKey(rsaKey.toRSAPublicKey())
                        .signatureAlgorithm(SignatureAlgorithm.RS256)
                        .build(),
                props,
                "https://app.erdonline.com",
                rsaKey.getKeyID(),
                jwks);
        assertEquals("https://app.erdonline.com", s.issuer());
    }

    @Test
    void jwksDocument_publishesPublicKeyOnly() {
        Map<String, Object> doc = service.jwksDocument();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> keys = (List<Map<String, Object>>) doc.get("keys");
        assertEquals(1, keys.size());
        Map<String, Object> jwk = keys.get(0);
        assertEquals("RSA", jwk.get("kty"));
        assertEquals(rsaKey.getKeyID(), jwk.get("kid"));
        assertNotNull(jwk.get("n"));
        assertNotNull(jwk.get("e"));
        assertFalse(jwk.containsKey("d"));
    }

    @Test
    void prodRejectsMissingRsaKey() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        OidcProperties empty = new OidcProperties();
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> OidcRsaKeySupport.load(empty, env));
        assertTrue(ex.getMessage().contains("ERD_OIDC_RSA_PRIVATE_KEY"));
    }

    @Test
    void nonProdAutogenOrLoadFromPemPath(@TempDir Path dir) throws Exception {
        RSAKey generated = new RSAKeyGenerator(2048).keyUse(KeyUse.SIGNATURE).keyID("unit-kid").generate();
        Path pem = dir.resolve("oidc.pem");
        Files.writeString(pem, OidcRsaKeySupport.toPkcs8Pem(generated));
        OidcProperties p = new OidcProperties();
        p.setRsaPrivateKeyPath(pem.toString());
        p.setRsaKeyId("unit-kid");
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        OidcRsaKeySupport.Loaded loaded = OidcRsaKeySupport.load(p, env);
        assertEquals("unit-kid", loaded.keyId());
        assertFalse(loaded.jwksDocument().toString().contains("\"d\""));
    }

    @Test
    void fromPem_envInline() throws Exception {
        RSAKey generated = new RSAKeyGenerator(2048).keyUse(KeyUse.SIGNATURE).generate();
        String pem = OidcRsaKeySupport.toPkcs8Pem(generated);
        OidcProperties p = new OidcProperties();
        p.setRsaPrivateKey(pem);
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        OidcRsaKeySupport.Loaded loaded = OidcRsaKeySupport.load(p, env);
        assertNotNull(loaded.keyId());
        assertEquals(1, ((List<?>) loaded.jwksDocument().get("keys")).size());
    }
}
