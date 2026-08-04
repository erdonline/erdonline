package com.erdonline.erd.publicapi;

import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * OIDC Discovery + JWKS（RSA 公钥；见 docs/security-model.md）。
 */
@RestController
@RequiredArgsConstructor
public class OidcDiscoveryController {

    private final OidcIdTokenService oidcIdTokenService;

    @GetMapping(value = "/.well-known/openid-configuration", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> openidConfiguration() {
        String issuer = oidcIdTokenService.issuer();
        Map<String, Object> doc = new LinkedHashMap<>();
        doc.put("issuer", issuer);
        doc.put("authorization_endpoint", issuer + "/oauth/authorize");
        doc.put("token_endpoint", issuer + "/auth/oauth/token");
        doc.put("userinfo_endpoint", issuer + "/auth/oauth/userinfo");
        doc.put("revocation_endpoint", issuer + "/auth/oauth/revoke");
        doc.put("jwks_uri", issuer + "/.well-known/jwks.json");
        doc.put("response_types_supported", List.of("code"));
        doc.put("subject_types_supported", List.of("public"));
        doc.put("id_token_signing_alg_values_supported", List.of("RS256"));
        doc.put("scopes_supported", List.of(
                PatScopes.OPENID,
                PatScopes.PROJECTS_READ,
                PatScopes.VERSIONS_READ,
                PatScopes.PROJECTS_WRITE,
                PatScopes.VERSIONS_WRITE));
        doc.put("token_endpoint_auth_methods_supported",
                List.of("client_secret_post", "client_secret_basic", "none"));
        doc.put("grant_types_supported",
                List.of("authorization_code", "refresh_token", "client_credentials"));
        doc.put("code_challenge_methods_supported", List.of("S256"));
        doc.put("claims_supported", List.of("sub", "iss", "aud", "exp", "iat", "preferred_username", "name"));
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(doc);
    }

    /** 发布 RSA 公钥 JWK（含 kid）；私钥永不进 JWKS。 */
    @GetMapping(value = "/.well-known/jwks.json", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> jwks() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(oidcIdTokenService.jwksDocument());
    }
}
