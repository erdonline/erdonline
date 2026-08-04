package com.erdonline.erd.publicapi;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * OAuth 2.0 Authorization Code（切片 B + PKCE S256）。
 * 须会话 JWT；薄同意：已登录即签发 code 并 302（产品 UI 同意页可先渲染再跳本端）。
 * <p>redirect_uri 未注册时永不 302（防开放重定向）。
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
        return authorize(responseType, clientId, redirectUri, scope, state,
                codeChallenge, codeChallengeMethod);
    }

    /** 表单 POST 同意（与 GET 同参）；供薄 UI「允许」提交。 */
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
            @RequestParam(value = "code_challenge_method", required = false) String codeChallengeMethod) {
        return authorize(responseType, clientId, redirectUri, scope, state,
                codeChallenge, codeChallengeMethod);
    }

    private ResponseEntity<?> authorize(
            String responseType,
            String clientId,
            String redirectUri,
            String scope,
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

        try {
            OAuthApiClientService.AuthCodeIssued issued = oauthApiClientService.createAuthorizationCode(
                    clientId.trim(),
                    redirectUri.trim(),
                    scope,
                    state.trim(),
                    codeChallenge.trim(),
                    codeChallengeMethod.trim());
            URI location = appendQuery(issued.redirectUri(), "code", issued.code(), "state", issued.state());
            return ResponseEntity.status(HttpStatus.FOUND).location(location).build();
        } catch (IllegalArgumentException ex) {
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
            return ResponseEntity.status(HttpStatus.FOUND).location(location).build();
        }
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
