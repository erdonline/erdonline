package com.erdonline.auth.endpint;

import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.common.core.exception.StatefulException;
import com.erdonline.common.security.jwt.JwtTokenService;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.config.ErdSecurityProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * JWT 登录控制器：空参 / 错密 / 成功签发。
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthLoginControllerTest {

    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtTokenService jwtTokenService;

    private AuthLoginController controller;

    @BeforeEach
    void setUp() {
        ErdSecurityProperties erdSecurityProperties = new ErdSecurityProperties();
        erdSecurityProperties.setE2eAccountsEnabled(true);
        controller = new AuthLoginController(authenticationManager, jwtTokenService, erdSecurityProperties);
    }

    @Test
    void rejectsBlankCredentials() {
        AuthLoginController.LoginRequest req = new AuthLoginController.LoginRequest();
        req.setUsername(" ");
        req.setPassword("");
        ResponseEntity<?> resp = controller.login(req);
        assertEquals(HttpStatus.UNAUTHORIZED, resp.getStatusCode());
        assertTrue(resp.getBody() instanceof R);
    }

    @Test
    void rejectsBadPassword() {
        AuthLoginController.LoginRequest req = new AuthLoginController.LoginRequest();
        req.setUsername("admin");
        req.setPassword("wrong");
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad"));

        ResponseEntity<?> resp = controller.login(req);
        assertEquals(HttpStatus.UNAUTHORIZED, resp.getStatusCode());
        R body = (R) resp.getBody();
        assertEquals(ApiErrorCode.ERROR_USERNAME_OR_PASSWORD.getCode(), body.getCode());
    }

    @Test
    void issuesTokenOnSuccess() {
        AuthLoginController.LoginRequest req = new AuthLoginController.LoginRequest();
        req.setUsername("admin");
        req.setPassword("123456");
        MartinUser user = new MartinUser(
                "1", "d1", Set.of("r1"), "t1", "admin", "x",
                true, true, true, true,
                List.of(new SimpleGrantedAuthority("erd_project_page")));
        Authentication auth = new UsernamePasswordAuthenticationToken(user, "123456", user.getAuthorities());
        when(authenticationManager.authenticate(any())).thenReturn(auth);
        when(jwtTokenService.issue(user)).thenReturn(Map.of("access_token", "jwt-demo", "token_type", "Bearer"));

        ResponseEntity<?> resp = controller.login(req);
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) resp.getBody();
        assertEquals("jwt-demo", body.get("access_token"));
    }

    @Test
    void mapsStatefulExceptionFromCause() {
        AuthLoginController.LoginRequest req = new AuthLoginController.LoginRequest();
        req.setUsername("nobody");
        req.setPassword("x");
        RuntimeException wrapped = new RuntimeException(
                new StatefulException(ApiErrorCode.USER_NOT_FOUND));
        when(authenticationManager.authenticate(any())).thenThrow(wrapped);

        ResponseEntity<?> resp = controller.login(req);
        assertEquals(HttpStatus.UNAUTHORIZED, resp.getStatusCode());
        R body = (R) resp.getBody();
        assertEquals(ApiErrorCode.USER_NOT_FOUND.getCode(), body.getCode());
    }
}
