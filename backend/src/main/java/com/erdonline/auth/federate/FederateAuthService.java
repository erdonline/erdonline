package com.erdonline.auth.federate;

import com.erdonline.common.security.jwt.JwtTokenService;
import com.erdonline.common.security.userdetail.MartinUser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 联邦 OAuth 起跳 / 回调 / 短票换会话 JWT。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FederateAuthService {

    public static final String MODE_LOGIN = "login";
    public static final String MODE_LINK = "link";

    private final FederateProperties properties;
    private final FederateStateStore stateStore;
    private final GitHubOauthClient githubClient;
    private final GoogleOidcClient googleClient;
    private final WeChatOpenPlatformClient wechatClient;
    private final FederateUserService userService;
    private final JwtTokenService jwtTokenService;
    private final ObjectMapper objectMapper;

    @Value("${martin.ui.url:http://localhost:8000}")
    private String martinUiUrl;

    public Map<String, Boolean> providers() {
        Map<String, Boolean> m = new LinkedHashMap<>(4);
        m.put("github", properties.isGithubEnabled());
        m.put("google", properties.isGoogleEnabled());
        m.put("wechat", properties.isWechatEnabled());
        return m;
    }

    public void assertEnabled(FederateProvider provider) {
        if (!properties.isEnabled(provider)) {
            throw new FederateException(404, provider.wire() + " login is not configured");
        }
    }

    public String startAuthorize(FederateProvider provider, String mode, String userId, String redirect) {
        assertEnabled(provider);
        String safeRedirect = sanitizeRedirect(redirect);
        String state = stateStore.putState(mode, provider, userId, safeRedirect);
        return buildAuthorizeUrl(provider, state);
    }

    public String handleCallback(FederateProvider provider, String code, String state) {
        assertEnabled(provider);
        if (!StringUtils.hasText(code)) {
            throw new FederateException(400, "missing code");
        }
        FederateStateStore.FederateState st = stateStore.takeState(state)
                .orElseThrow(() -> new FederateException(400, "invalid or expired state"));
        if (st.provider() != provider) {
            throw new FederateException(400, "state provider mismatch");
        }
        FederateIdentity identity;
        try {
            identity = exchange(provider, code);
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("federate exchange failed provider={}: {}", provider.wire(), e.toString());
            throw new FederateException(502, "IdP exchange failed");
        }

        if (MODE_LINK.equals(st.mode())) {
            if (!StringUtils.hasText(st.userId())) {
                throw new FederateException(401, "link requires authenticated start");
            }
            userService.linkToUser(st.userId(), identity);
            return buildUiRedirect("/account/settings?selectKey=security", null, null);
        }

        MartinUser user = userService.resolveForLogin(identity);
        Map<String, Object> tokenBody = jwtTokenService.issue(user);
        String json;
        try {
            json = objectMapper.writeValueAsString(tokenBody);
        } catch (JsonProcessingException e) {
            throw new FederateException(500, "token serialize failed");
        }
        String ticket = stateStore.putSessionTicket(json);
        return buildUiRedirect(properties.getSuccessPath(), ticket, st.redirect());
    }

    private String buildAuthorizeUrl(FederateProvider provider, String state) {
        return switch (provider) {
            case GITHUB -> githubClient.buildAuthorizeUrl(state);
            case GOOGLE -> googleClient.buildAuthorizeUrl(state);
            case WECHAT -> wechatClient.buildAuthorizeUrl(state);
        };
    }

    private FederateIdentity exchange(FederateProvider provider, String code)
            throws IOException, InterruptedException {
        return switch (provider) {
            case GITHUB -> githubClient.exchange(code);
            case GOOGLE -> googleClient.exchange(code);
            case WECHAT -> wechatClient.exchange(code);
        };
    }

    public Map<String, Object> consumeTicket(String ticket) {
        String json = stateStore.takeSessionTicket(ticket)
                .orElseThrow(() -> new FederateException(400, "invalid or expired ticket"));
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> body = objectMapper.readValue(json, Map.class);
            return body;
        } catch (IOException e) {
            throw new FederateException(500, "ticket parse failed");
        }
    }

    /** IdP 回调失败时浏览器落点（与 successPath 同页，带 {@code error} 查询参数）。 */
    public String buildFailureRedirect(String message) {
        String msg = StringUtils.hasText(message) ? message.trim() : "第三方登录失败";
        return UriComponentsBuilder.fromUriString(primaryUiOrigin() + properties.getSuccessPath())
                .queryParam("error", msg)
                .build()
                .encode()
                .toUriString();
    }

    static String sanitizeRedirect(String redirect) {
        if (!StringUtils.hasText(redirect)) {
            return null;
        }
        String r = redirect.trim();
        if (!r.startsWith("/") || r.startsWith("//")) {
            return null;
        }
        if (r.contains("://") || r.contains("\\")) {
            return null;
        }
        return r.length() > 512 ? r.substring(0, 512) : r;
    }

    private String buildUiRedirect(String path, String ticket, String appRedirect) {
        String base = primaryUiOrigin();
        String p = StringUtils.hasText(path) ? path.trim() : "/login/federate";
        if (!p.startsWith("/")) {
            p = "/" + p;
        }
        UriComponentsBuilder b = UriComponentsBuilder.fromUriString(base + p);
        if (StringUtils.hasText(ticket)) {
            b.queryParam("ticket", ticket);
        }
        if (StringUtils.hasText(appRedirect)) {
            b.queryParam("redirect", appRedirect);
        }
        // 注意：不能用 build(true)——它假定各组件已预编码，appRedirect 里的原始 '?'/'=' 会被当作
        // QUERY_PARAM 非法字符直接抛 IllegalArgumentException（如 /s/public-demo?autofork=1）。
        // 这里的 ticket/appRedirect 都是未编码的原始值，须用 build().encode() 统一编码。
        return b.build().encode().toUriString();
    }

    private String primaryUiOrigin() {
        if (!StringUtils.hasText(martinUiUrl)) {
            return "http://localhost:8000";
        }
        String first = martinUiUrl.split(",")[0].trim();
        if (!StringUtils.hasText(first) || "*".equals(first)) {
            return "http://localhost:8000";
        }
        while (first.endsWith("/") && first.length() > 1) {
            first = first.substring(0, first.length() - 1);
        }
        return first;
    }
}
