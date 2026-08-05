package com.erdonline.auth.federate;

import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FederateControllerTest {

    @Mock
    private FederateAuthService authService;
    @Mock
    private FederateUserService userService;

    private FederateController controller;

    @BeforeEach
    void setUp() {
        controller = new FederateController(authService, userService);
    }

    @Test
    void session_mapsFederateExceptionToMatchingBusinessCode() {
        when(authService.consumeTicket("bad"))
                .thenThrow(new FederateException(403, "开放注册已关闭，请使用已有账号登录后绑定，或联系管理员"));

        ResponseEntity<?> resp = controller.session("bad");
        assertEquals(HttpStatus.FORBIDDEN, resp.getStatusCode());
        @SuppressWarnings("unchecked")
        R<Object> body = (R<Object>) resp.getBody();
        assertNotNull(body);
        assertEquals(403, body.getCode());
        assertTrue(body.getMsg().contains("开放注册已关闭"));
    }

    @Test
    void callback_redirectsToUiWithErrorInsteadOfJson() {
        when(authService.handleCallback(eq(FederateProvider.GOOGLE), eq("code"), eq("state")))
                .thenThrow(new FederateException(403, "开放注册已关闭，请使用已有账号登录后绑定，或联系管理员"));
        when(authService.buildFailureRedirect(any()))
                .thenReturn("http://localhost:8000/login/federate?error=%E5%BC%80%E6%94%BE%E6%B3%A8%E5%86%8C");

        ResponseEntity<?> resp = controller.callback("google", "code", "state", null, null);
        assertEquals(HttpStatus.FOUND, resp.getStatusCode());
        assertNotNull(resp.getHeaders().getLocation());
        assertTrue(resp.getHeaders().getLocation().toString().contains("error="));
    }

    @Test
    void startLogin_mapsFederateExceptionToMatchingBusinessCode() {
        when(authService.startAuthorize(any(), any(), any(), any()))
                .thenThrow(new FederateException(404, "google login is not configured"));

        ResponseEntity<?> resp = controller.startLogin("google", null);
        assertEquals(HttpStatus.NOT_FOUND, resp.getStatusCode());
        @SuppressWarnings("unchecked")
        R<Object> body = (R<Object>) resp.getBody();
        assertEquals(ApiErrorCode.NOT_FOUND.getCode(), body.getCode());
    }
}
