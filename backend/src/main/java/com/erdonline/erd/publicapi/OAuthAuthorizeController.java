package com.erdonline.erd.publicapi;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * OAuth 2.0 Authorization Code（切片 B + PKCE S256）+ 显式同意。
 * <ul>
 *   <li>GET：会话 JWT → 同意页预览 JSON（不签发 code）</li>
 *   <li>POST {@code decision=allow}：签发 {@code erd_ac_} 并 302（或 JSON {@code redirect_to}）</li>
 *   <li>POST {@code decision=deny}：302 {@code error=access_denied}（redirect 须已注册）</li>
 * </ul>
 * 产品 UI：SPA {@code /oauth/authorize}；API 路径兼 {@code /auth/oauth/authorize}（网关前缀）。
 */
@RestController
@RequiredArgsConstructor
public class OAuthAuthorizeController {

    private final OAuthApiClientService oauthApiClientService;

    @GetMapping({"/oauth/authorize", "/auth/oauth/authorize"})
    public ResponseEntity<?> authorizeGet(
            @RequestParam(value = "response_type", required = false) String responseType,
            @RequestParam(value = "client_id", required = false) String clientId,
            @RequestParam(value = "redirect_uri", required = false) String redirectUri,
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "code_challenge", required = false) String codeChallenge,
            @RequestParam(value = "code_challenge_method", required = false) String codeChallengeMethod) {
        ResponseEntity<?> bad = validateCommonParams(
                responseType, clientId, redirectUri, state, codeChallenge, codeChallengeMethod);
        if (bad != null) {
            return bad;
        }
        try {
            OAuthConsentView view = oauthApiClientService.previewAuthorization(
                    clientId.trim(),
                    redirectUri.trim(),
                    scope,
                    state.trim(),
                    codeChallenge.trim(),
                    codeChallengeMethod.trim());
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(view);
        } catch (IllegalArgumentException ex) {
            // GET 预览永不 302（SPA 同意页消费 JSON）；错误一律 JSON
            return authorizeJsonError(ex);
        }
    }

    @PostMapping(
            value = {"/oauth/authorize", "/auth/oauth/authorize"},
            consumes = {
                    MediaType.APPLICATION_FORM_URLENCODED_VALUE,
                    MediaType.MULTIPART_FORM_DATA_VALUE,
                    MediaType.ALL_VALUE
            })
    public ResponseEntity<?> authorizePost(
            @RequestParam(value = "response_type", required = false) String responseType,
            @RequestParam(value = "client_id", required = false) String clientId,
            @RequestParam(value = "redirect_uri", required = false) String redirectUri,
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "code_challenge", required = false) String codeChallenge,
            @RequestParam(value = "code_challenge_method", required = false) String codeChallengeMethod,
            @RequestParam(value = "decision", required = false) String decision,
            @RequestHeader(value = HttpHeaders.ACCEPT, required = false) String accept) {

        ResponseEntity<?> bad = validateCommonParams(
                responseType, clientId, redirectUri, state, codeChallenge, codeChallengeMethod);
        if (bad != null) {
            return bad;
        }
        String dec = decision == null ? "" : decision.trim().toLowerCase(Locale.ROOT);
        if (!"allow".equals(dec) && !"deny".equals(dec)) {
            return jsonError(HttpStatus.BAD_REQUEST, "invalid_request",
                    "decision must be allow or deny");
        }

        boolean preferJson = acceptsJson(accept);

        if ("deny".equals(dec)) {
            boolean mayRedirect = oauthApiClientService.isRedirectUriRegistered(clientId, redirectUri)
                    && StringUtils.hasText(state);
            if (!mayRedirect) {
                return jsonError(HttpStatus.BAD_REQUEST, "invalid_request",
                        "cannot redirect deny: redirect_uri not registered");
            }
            URI location = appendQuery(redirectUri.trim(),
                    "error", "access_denied",
                    "error_description", "The resource owner denied the request",
                    "state", state.trim());
            return redirectOrJson(location, preferJson);
        }

        try {
            OAuthApiClientService.AuthCodeIssued issued = oauthApiClientService.createAuthorizationCode(
                    clientId.trim(),
                    redirectUri.trim(),
                    scope,
                    state.trim(),
                    codeChallenge.trim(),
                    codeChallengeMethod.trim());
            URI location = appendQuery(issued.redirectUri(), "code", issued.code(), "state", issued.state());
            return redirectOrJson(location, preferJson);
        } catch (IllegalArgumentException ex) {
            return authorizeExceptionResponse(ex, clientId, redirectUri, state, preferJson);
        }
    }

    private ResponseEntity<?> validateCommonParams(
            String responseType,
            String clientId,
            String redirectUri,
            String state,
            String codeChallenge,
            String codeChallengeMethod) {
        if (!StringUtils.hasText(responseType) || !"code".equals(responseType.trim())) {
            return jsonError(HttpStatus.BAD_REQUEST, "unsupported_response_type",
                    "only response_type=code supported");
        }
        if (!StringUtils.hasText(clientId) || !StringUtils.hasText(redirectUri)
                || !StringUtils.hasText(state)
                || !StringUtils.hasText(codeChallenge)
                || !StringUtils.hasText(codeChallengeMethod)) {
            return jsonError(HttpStatus.BAD_REQUEST, "invalid_request",
                    "client_id, redirect_uri, state, code_challenge, code_challenge_method required");
        }
        return null;
    }

    private ResponseEntity<?> authorizeJsonError(IllegalArgumentException ex) {
        String msg = ex.getMessage() == null ? "invalid_request" : ex.getMessage();
        return jsonError(HttpStatus.BAD_REQUEST,
                "invalid_client".equals(msg) ? "invalid_client"
                        : "invalid_scope".equals(msg) ? "invalid_scope"
                        : "invalid_request",
                safeDesc(msg));
    }

    private ResponseEntity<?> authorizeExceptionResponse(
            IllegalArgumentException ex,
            String clientId,
            String redirectUri,
            String state,
            boolean preferJsonRedirect) {
        String msg = ex.getMessage() == null ? "invalid_request" : ex.getMessage();
        boolean mayRedirect = oauthApiClientService.isRedirectUriRegistered(clientId, redirectUri)
                && StringUtils.hasText(state);
        if (!mayRedirect || "invalid_client".equals(msg)
                || msg.contains("redirect_uri")
                || msg.startsWith("redirect_uri")) {
            return jsonError(HttpStatus.BAD_REQUEST,
                    "invalid_client".equals(msg) ? "invalid_client" : "invalid_request",
                    safeDesc(msg));
        }
        URI location = appendQuery(redirectUri.trim(),
                "error", mapAuthorizeError(msg),
                "error_description", safeDesc(msg),
                "state", state.trim());
        return redirectOrJson(location, preferJsonRedirect);
    }

    private static ResponseEntity<?> redirectOrJson(URI location, boolean preferJson) {
        if (preferJson) {
            Map<String, Object> body = new LinkedHashMap<>(2);
            body.put("redirect_to", location.toString());
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body);
        }
        return ResponseEntity.status(HttpStatus.FOUND).location(location).build();
    }

    static boolean acceptsJson(String accept) {
        if (!StringUtils.hasText(accept)) {
            return false;
        }
        String lower = accept.toLowerCase(Locale.ROOT);
        return lower.contains(MediaType.APPLICATION_JSON_VALUE)
                && !lower.trim().equals("*/*");
    }

    /** 在已有 query 上追加参数（精确保留 redirect_uri 注册串前缀）。 */
    static URI appendQuery(String baseUri, String... kv) {
        UriComponentsBuilder b = UriComponentsBuilder.fromUriString(baseUri);
        for (int i = 0; i + 1 < kv.length; i += 2) {
            b.queryParam(kv[i], kv[i + 1]);
        }
        return b.encode().build().toUri();
    }

    private static String mapAuthorizeError(String msg) {
        if ("invalid_scope".equals(msg)) {
            return "invalid_scope";
        }
        if ("invalid_client".equals(msg)) {
            return "invalid_client";
        }
        if ("access_denied".equals(msg)) {
            return "access_denied";
        }
        return "invalid_request";
    }

    private static String safeDesc(String msg) {
        if (msg == null) {
            return "request failed";
        }
        if (msg.startsWith("invalid_request:")) {
            return msg.substring("invalid_request:".length());
        }
        return msg.length() > 120 ? msg.substring(0, 120) : msg;
    }

    private static ResponseEntity<Map<String, Object>> jsonError(
            HttpStatus status, String error, String desc) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", error);
        body.put("error_description", desc);
        return ResponseEntity.status(status)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
    }
}
