package com.erdonline.common.social.oauth2;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/8/3
 * @describtion SocialAuthenticationEntryPoint
 * @since 1.0
 */
@Slf4j
public class SocialAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException {
        log.error("authException: {}", authException);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType("text/plain");
        response.getWriter().write("用户未认证");
    }
}
