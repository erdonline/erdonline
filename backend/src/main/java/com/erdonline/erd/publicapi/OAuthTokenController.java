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
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * OAuth 2.0 token：{@code client_credentials}、{@code authorization_code}+PKCE、{@code refresh_token}。
 * 匿名可达；不经会话 JWT。
 */
@RestController
@RequiredArgsConstructor
public class OAuthTokenController {

    private static final Set<String> SUPPORTED =
            Set.of("client_credentials", "authorization_code", "refresh_token");

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
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "redirect_uri", required = false) String redirectUri,
            @RequestParam(value = "code_verifier", required = false) String codeVerifier,
            @RequestParam(value = "refresh_token", required = false) String refreshToken) {

        if (!StringUtils.hasText(grantType)) {
            return oauthError(HttpStatus.BAD_REQUEST, "invalid_request", "grant_type required");
        }
        String grant = grantType.trim().toLowerCase(Locale.ROOT);
        if (!SUPPORTED.contains(grant)) {
            return oauthError(HttpStatus.BAD_REQUEST, "unsupported_grant_type",
                    "supported: client_credentials, authorization_code, refresh_token");
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
            OAuthTokenResponse issued;
            if ("client_credentials".equals(grant)) {
                issued = oauthApiClientService.issueClientCredentials(
                        resolvedId, resolvedSecret, scope);
            } else if ("refresh_token".equals(grant)) {
                issued = oauthApiClientService.refreshAccessToken(
                        resolvedId, resolvedSecret, refreshToken, scope);
            } else {
                issued = oauthApiClientService.exchangeAuthorizationCode(
                        resolvedId, resolvedSecret, code, redirectUri, codeVerifier);
            }
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("access_token", issued.getAccessToken());
            body.put("token_type", issued.getTokenType());
            body.put("expires_in", issued.getExpiresIn());
            body.put("scope", issued.getScope());
            if (StringUtils.hasText(issued.getRefreshToken())) {
                body.put("refresh_token", issued.getRefreshToken());
                if (issued.getRefreshExpiresIn() != null) {
                    body.put("refresh_expires_in", issued.getRefreshExpiresIn());
                }
            }
            if (StringUtils.hasText(issued.getIdToken())) {
                body.put("id_token", issued.getIdToken());
            }
            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "no-store")
                    .header(HttpHeaders.PRAGMA, "no-cache")
                    .body(body);
        } catch (IllegalArgumentException ex) {
            return mapTokenException(ex);
        }
    }

    private static ResponseEntity<Map<String, Object>> mapTokenException(IllegalArgumentException ex) {
        String code = ex.getMessage() == null ? "invalid_client" : ex.getMessage();
        return switch (code) {
            case "invalid_scope" -> oauthError(HttpStatus.BAD_REQUEST, "invalid_scope",
                    "requested scope not allowed");
            case "unauthorized_client" -> oauthError(HttpStatus.BAD_REQUEST, "unauthorized_client",
                    "grant type not allowed for this client");
            case "invalid_grant" -> oauthError(HttpStatus.BAD_REQUEST, "invalid_grant",
                    "authorization code / refresh_token / pkce / redirect_uri rejected");
            case "invalid_request" -> oauthError(HttpStatus.BAD_REQUEST, "invalid_request",
                    "missing or malformed parameters");
            default -> oauthError(HttpStatus.UNAUTHORIZED, "invalid_client",
                    "client authentication failed");
        };
    }

    private static ResponseEntity<Map<String, Object>> oauthError(HttpStatus status, String error, String desc) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", error);
        body.put("error_description", desc);
        return ResponseEntity.status(status)
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
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
