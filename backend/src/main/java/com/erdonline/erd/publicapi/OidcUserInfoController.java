package com.erdonline.erd.publicapi;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * OIDC UserInfo：Bearer {@code erd_oat_} 且 scope 含 {@code openid}。
 * 匿名 Spring Security 放行；本控制器自行鉴权（不接受会话 JWT / PAT）。
 */
@RestController
@RequiredArgsConstructor
public class OidcUserInfoController {

    private final OAuthApiClientService oauthApiClientService;
    private final OidcIdTokenService oidcIdTokenService;

    @GetMapping(
            value = {"/oauth/userinfo", "/auth/oauth/userinfo"},
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> userinfo(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return oauthError(HttpStatus.UNAUTHORIZED, "invalid_token", "Bearer OAuth access token required");
        }
        String raw = header.substring(7).trim();
        if (!OAuthClientCodec.looksLikeAccessToken(raw)) {
            return oauthError(HttpStatus.UNAUTHORIZED, "invalid_token",
                    "expected OAuth access token (erd_oat_…); PAT and session JWT are not accepted");
        }
        Optional<OAuthApiClientService.AuthenticatedOat> auth =
                oauthApiClientService.authenticateAccessToken(raw);
        if (auth.isEmpty()) {
            return oauthError(HttpStatus.UNAUTHORIZED, "invalid_token",
                    "invalid, expired, or revoked OAuth access token");
        }
        OAuthApiClientService.AuthenticatedOat oat = auth.get();
        Set<String> scopes = Set.copyOf(oat.scopes());
        if (!PatScopes.has(scopes, PatScopes.OPENID)) {
            return oauthError(HttpStatus.FORBIDDEN, "insufficient_scope", "openid scope required");
        }
        oauthApiClientService.touchLastUsed(oat.tokenId());
        return ResponseEntity.ok(oidcIdTokenService.userInfoClaims(
                oat.user().getId(), oat.user().getUsername()));
    }

    private static ResponseEntity<Map<String, Object>> oauthError(
            HttpStatus status, String error, String desc) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", error);
        body.put("error_description", desc);
        return ResponseEntity.status(status)
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
    }
}
