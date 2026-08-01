package com.erdonline.common.security.dynamic;

import cn.hutool.json.JSONUtil;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/3/24
 * @describtion RestAuthenticationEntryPoint
 * @since 1.0
 */
@Slf4j
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException, ServletException {
        log.debug("RestAuthenticationEntryPoint,接口[{}]认证失败：{}", request.getRequestURI(), authException);
        response.setHeader("Cache-Control", "no-cache");
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.getWriter().println(JSONUtil.parse(R.failed(ApiErrorCode.UNAUTHORIZED)));
        response.getWriter().flush();
    }
}
