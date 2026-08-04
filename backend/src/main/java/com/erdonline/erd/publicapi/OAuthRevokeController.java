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

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * RFC 7009 风格令牌吊销（logout）：吊销 access / refresh；整族失效。
 * 匿名可达；不经会话 JWT。未知票仍 200（防探测）；client 认证失败除外。
 */
@RestController
@RequiredArgsConstructor
public class OAuthRevokeController {

    private final OAuthApiClientService oauthApiClientService;

    @PostMapping(
            value = {"/oauth/revoke", "/auth/oauth/revoke"},
            consumes = {
                    MediaType.APPLICATION_FORM_URLENCODED_VALUE,
                    MediaType.MULTIPART_FORM_DATA_VALUE,
                    MediaType.ALL_VALUE
            })
    public ResponseEntity<?> revoke(
            HttpServletRequest request,
            @RequestParam(value = "token", required = false) String token,
            @RequestParam(value = "token_type_hint", required = false) String tokenTypeHint,
            @RequestParam(value = "client_id", required = false) String clientId,
            @RequestParam(value = "client_secret", required = false) String clientSecret) {

        String resolvedId = clientId;
        String resolvedSecret = clientSecret;
        String[] basic = OAuthTokenController.parseBasic(request.getHeader(HttpHeaders.AUTHORIZATION));
        if (basic != null) {
            if (!StringUtils.hasText(resolvedId)) {
                resolvedId = basic[0];
            }
            if (!StringUtils.hasText(resolvedSecret)) {
                resolvedSecret = basic[1];
            }
        }

        try {
            oauthApiClientService.revokePresentedToken(
                    resolvedId, resolvedSecret, token, tokenTypeHint);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "no-store")
                    .header(HttpHeaders.PRAGMA, "no-cache")
                    .build();
        } catch (IllegalArgumentException ex) {
            String code = ex.getMessage() == null ? "invalid_client" : ex.getMessage();
            if ("invalid_client".equals(code)) {
                Map<String, Object> body = new LinkedHashMap<>();
                body.put("error", "invalid_client");
                body.put("error_description", "client authentication failed");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .header(HttpHeaders.CACHE_CONTROL, "no-store")
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body);
            }
            return ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, "no-store")
                    .header(HttpHeaders.PRAGMA, "no-cache")
                    .build();
        }
    }
}
