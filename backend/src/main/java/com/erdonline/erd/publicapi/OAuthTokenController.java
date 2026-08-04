package com.erdonline.erd.publicapi;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * OAuth 2.0 token（切片 A：仅 {@code client_credentials}）。匿名可达；不经会话 JWT。
 * Authorization Code / PKCE 见切片 B。
 */
@RestController
@RequiredArgsConstructor
public class OAuthTokenController {

    private final OAuthApiClientService oauthApiClientService;

    @PostMapping(
            value = {"/oauth/token", "/auth/oauth/token"},
            consumes = {
                    MediaType.APPLICATION_FORM_URLENCODED_VALUE,
                    MediaType.MULTIPART_FORM_DATA_VALUE,
                    MediaType.ALL_VALUE
            })
    public ResponseEntity<?> token(
            HttpServletRequest request,
            @RequestParam(value = "grant_type", required = false) String grantType,
            @RequestParam(value = "client_id", required = false) String clientId,
            @RequestParam(value = "client_secret", required = false) String clientSecret,
            @RequestParam(value = "scope", required = false) String scope) {

        if (!StringUtils.hasText(grantType)) {
            return oauthError(HttpStatus.BAD_REQUEST, "invalid_request", "grant_type required");
        }
        if (!"client_credentials".equals(grantType.trim())) {
            return oauthError(HttpStatus.BAD_REQUEST, "unsupported_grant_type",
                    "only client_credentials in this milestone (Authorization Code deferred)");
        }

        String resolvedId = clientId;
        String resolvedSecret = clientSecret;
        String[] basic = parseBasic(request.getHeader(HttpHeaders.AUTHORIZATION));
        if (basic != null) {
            if (!StringUtils.hasText(resolvedId)) {
                resolvedId = basic[0];
            }
            if (!StringUtils.hasText(resolvedSecret)) {
                resolvedSecret = basic[1];
            }
        }

        try {
            OAuthTokenResponse issued = oauthApiClientService.issueClientCredentials(
                    resolvedId, resolvedSecret, scope);
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("access_token", issued.getAccessToken());
            body.put("token_type", issued.getTokenType());
            body.put("expires_in", issued.getExpiresIn());
            body.put("scope", issued.getScope());
            return ResponseEntity.ok(body);
        } catch (IllegalArgumentException ex) {
            String code = ex.getMessage() == null ? "invalid_client" : ex.getMessage();
            if ("invalid_scope".equals(code)) {
                return oauthError(HttpStatus.BAD_REQUEST, "invalid_scope", "requested scope not allowed");
            }
            return oauthError(HttpStatus.UNAUTHORIZED, "invalid_client", "client authentication failed");
        }
    }

    private static ResponseEntity<Map<String, Object>> oauthError(HttpStatus status, String error, String desc) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", error);
        body.put("error_description", desc);
        return ResponseEntity.status(status).contentType(MediaType.APPLICATION_JSON).body(body);
    }

    /** @return [clientId, clientSecret] or null */
    static String[] parseBasic(String authorization) {
        if (authorization == null || !authorization.regionMatches(true, 0, "Basic ", 0, 6)) {
            return null;
        }
        String encoded = authorization.substring(6).trim();
        if (encoded.isEmpty()) {
            return null;
        }
        try {
            String decoded = new String(Base64.getDecoder().decode(encoded), StandardCharsets.UTF_8);
            int colon = decoded.indexOf(':');
            if (colon < 0) {
                return new String[]{decoded, ""};
            }
            return new String[]{decoded.substring(0, colon), decoded.substring(colon + 1)};
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
