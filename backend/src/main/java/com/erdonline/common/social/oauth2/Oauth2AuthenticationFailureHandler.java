package com.erdonline.common.social.oauth2;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/8/3
 * @describtion Oauth2AuthenticationFailureHandler
 * @since 1.0
 */
@Slf4j
public class Oauth2AuthenticationFailureHandler implements AuthenticationFailureHandler {

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {
        log.error("", exception);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType("text/plain");
        response.getWriter().write("认证失败");
    }
}
