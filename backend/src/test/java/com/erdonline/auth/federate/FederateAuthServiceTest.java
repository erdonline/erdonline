package com.erdonline.auth.federate;

import com.erdonline.common.security.jwt.JwtTokenService;
import com.erdonline.common.security.userdetail.MartinUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FederateAuthServiceTest {

    @Test
    void sanitizeRedirect_acceptsRelativePaths() {
        assertEquals("/home", FederateAuthService.sanitizeRedirect("/home"));
        assertEquals("/oauth/authorize?x=1", FederateAuthService.sanitizeRedirect("/oauth/authorize?x=1"));
    }

    @Test
    void sanitizeRedirect_rejectsOpenRedirect() {
        assertNull(FederateAuthService.sanitizeRedirect("https://evil.example/phish"));
        assertNull(FederateAuthService.sanitizeRedirect("//evil.example"));
        assertNull(FederateAuthService.sanitizeRedirect("\\\\evil"));
        assertNull(FederateAuthService.sanitizeRedirect("home"));
        assertNull(FederateAuthService.sanitizeRedirect(null));
        assertNull(FederateAuthService.sanitizeRedirect("  "));
    }

    @Test
    void propertiesDisabledWithoutCredentials() {
        FederateProperties p = new FederateProperties();
        assertFalse(p.isGithubEnabled());
        assertFalse(p.isGoogleEnabled());
        assertFalse(p.isWechatEnabled());
        p.getGoogle().setClientId("id");
        p.getGoogle().setClientSecret("secret");
        assertFalse(p.isGoogleEnabled());
        p.getGoogle().setRedirectUri("http://localhost:9502/auth/federate/google/callback");
        assertTrue(p.isGoogleEnabled());
        p.getGithub().setClientId("gh");
        p.getGithub().setClientSecret("sec");
        assertFalse(p.isGithubEnabled());
        p.getGithub().setRedirectUri("http://localhost:9502/auth/federate/github/callback");
        assertTrue(p.isGithubEnabled());
        assertTrue(p.isEnabled(FederateProvider.GITHUB));
    }

    @Test
    void providerWireRoundTrip() {
        assertEquals(FederateProvider.GOOGLE, FederateProvider.fromWire("Google"));
        assertEquals(FederateProvider.GITHUB, FederateProvider.fromWire("github"));
        assertEquals("wechat", FederateProvider.WECHAT.wire());
    }

    @Test
    void buildFailureRedirect_includesEncodedErrorOnSuccessPath() {
        FederateProperties props = new FederateProperties();
        props.setSuccessPath("/login/federate");
        FederateAuthService svc = new FederateAuthService(
                props,
                null,
                null,
                null,
                null,
                null,
                null,
                null);
        org.springframework.test.util.ReflectionTestUtils.setField(svc, "martinUiUrl", "http://localhost:8000");

        String url = svc.buildFailureRedirect("开放注册已关闭");
        assertTrue(url.startsWith("http://localhost:8000/login/federate?"));
        assertTrue(url.contains("error="));
    }

    /**
     * 回归：redirect 携带嵌套 query（如从 /s/xxx?autofork=1 分享页触发登录）时，
     * handleCallback 拼 UI 跳转 Location 曾用 build(true) 误判原始 '?'/'=' 为非法字符，
     * 直接抛 IllegalArgumentException，最终落到 /login/federate?error=Invalid character '='...
     * 见 CHANGELOG「联邦登录 redirect 携带 query 时回调 500/跳错误页」。
     */
    @Test
    void handleCallback_encodesRedirectWithNestedQueryString() throws Exception {
        FederateProperties props = new FederateProperties();
        props.setSuccessPath("/login/federate");
        props.getGoogle().setClientId("id");
        props.getGoogle().setClientSecret("secret");
        props.getGoogle().setRedirectUri("http://localhost:9502/auth/federate/google/callback");

        FederateStateStore stateStore = mock(FederateStateStore.class);
        GoogleOidcClient googleClient = mock(GoogleOidcClient.class);
        FederateUserService userService = mock(FederateUserService.class);
        JwtTokenService jwtTokenService = mock(JwtTokenService.class);

        FederateAuthService svc = new FederateAuthService(
                props,
                stateStore,
                null,
                googleClient,
                null,
                userService,
                jwtTokenService,
                new ObjectMapper());
        org.springframework.test.util.ReflectionTestUtils.setField(svc, "martinUiUrl", "http://localhost:8000");

        String nestedRedirect = "/s/public-demo?autofork=1";
        when(stateStore.takeState("state123")).thenReturn(Optional.of(
                new FederateStateStore.FederateState(
                        FederateAuthService.MODE_LOGIN, FederateProvider.GOOGLE, null, nestedRedirect)));
        when(googleClient.exchange("code123")).thenReturn(
                new FederateIdentity(FederateProvider.GOOGLE, "sub-1", null, "a@b.com", true, "A"));
        MartinUser user = mock(MartinUser.class);
        when(userService.resolveForLogin(any())).thenReturn(user);
        when(jwtTokenService.issue(user)).thenReturn(Map.of("access_token", "tok"));
        when(stateStore.putSessionTicket(any())).thenReturn("ticket123");

        String ui = svc.handleCallback(FederateProvider.GOOGLE, "code123", "state123");

        assertTrue(ui.startsWith("http://localhost:8000/login/federate?"), ui);
        assertTrue(ui.contains("ticket=ticket123"), ui);
        assertTrue(ui.contains("redirect="), ui);
        String rawQuery = java.net.URI.create(ui).getRawQuery();
        String redirectValue = java.util.Arrays.stream(rawQuery.split("&"))
                .filter(p -> p.startsWith("redirect="))
                .map(p -> p.substring("redirect=".length()))
                .findFirst()
                .orElseThrow();
        assertEquals(nestedRedirect, URLDecoder.decode(redirectValue, StandardCharsets.UTF_8));
    }
}
