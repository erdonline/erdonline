package com.erdonline.auth.endpint;

import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.common.core.exception.StatefulException;
import com.erdonline.common.security.jwt.JwtTokenService;
import com.erdonline.common.security.userdetail.MartinUser;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 现代登录：POST /auth/login（网关前缀剥离后为 /login）JSON 签发 JWT。
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class AuthLoginController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenService jwtTokenService;

    @PostMapping({"/login", "/auth/login"})
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        if (req == null || !StringUtils.hasText(req.getUsername()) || !StringUtils.hasText(req.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(R.failed(ApiErrorCode.ERROR_USERNAME_OR_PASSWORD));
        }
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));
            MartinUser user = (MartinUser) auth.getPrincipal();
            Map<String, Object> body = jwtTokenService.issue(user);
            return ResponseEntity.ok(body);
        } catch (StatefulException se) {
            ApiErrorCode code = ApiErrorCode.fromCode(se.getStatus());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(R.failed(code));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(R.failed(ApiErrorCode.ERROR_USERNAME_OR_PASSWORD));
        } catch (Exception e) {
            log.error("login failed", e);
            Throwable root = e;
            while (root.getCause() != null && root.getCause() != root) {
                root = root.getCause();
            }
            if (root instanceof StatefulException se) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(R.failed(ApiErrorCode.fromCode(se.getStatus())));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(R.failed(ApiErrorCode.ERROR_USERNAME_OR_PASSWORD));
        }
    }

    @Data
    public static class LoginRequest {
        private String username;
        private String password;
    }
}
