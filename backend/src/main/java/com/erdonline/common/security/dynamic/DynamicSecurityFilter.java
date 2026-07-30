package com.erdonline.common.security.dynamic;

import com.erdonline.common.security.properties.PermitAllUrlProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.SecurityMetadataSource;
import org.springframework.security.access.intercept.AbstractSecurityInterceptor;
import org.springframework.security.access.intercept.InterceptorStatusToken;
import org.springframework.security.web.FilterInvocation;
import org.springframework.util.AntPathMatcher;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.List;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/3/22
 * @describtion DynamicSecurityFilter
 * @since 1.0
 */
@Slf4j
public class DynamicSecurityFilter extends AbstractSecurityInterceptor implements Filter {

    @Autowired
    private DynamicSecurityMetadataSource dynamicSecurityMetadataSource;
    @Autowired
    private PermitAllUrlProperties permitAllUrlProperties;
    @Autowired
    private DynamicAccessDecisionManager dynamicAccessDecisionManager;

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        FilterInvocation fi = new FilterInvocation(servletRequest, servletResponse, filterChain);
        //OPTIONS请求直接放行
        if (request.getMethod().equals(HttpMethod.OPTIONS.toString())) {
            fi.getChain().doFilter(fi.getRequest(), fi.getResponse());
            return;
        }
        AntPathMatcher matcher = new AntPathMatcher();
        List<String> ignoreUrls = permitAllUrlProperties.getIgnoreUrls();
        String requestURI = request.getRequestURI();
        boolean isWhiteList = ignoreUrls.stream().anyMatch(u -> {
            return matcher.match(u, requestURI);
        });
        log.debug("DynamicSecurityFilter,url：{},ignoreUrls:{},isWhiteList:{}", requestURI, ignoreUrls, isWhiteList);
        //白名单请求直接放行
        if (isWhiteList) {
            fi.getChain().doFilter(fi.getRequest(), fi.getResponse());
            return;
        }
        //此处会调用AccessDecisionManager中的decide方法进行鉴权操作
        InterceptorStatusToken token = super.beforeInvocation(fi);
        try {
            fi.getChain().doFilter(fi.getRequest(), fi.getResponse());
        } finally {
            super.afterInvocation(token, null);
        }
    }

    @Override
    public void destroy() {
    }

    @Override
    public Class<?> getSecureObjectClass() {
        super.setAccessDecisionManager(dynamicAccessDecisionManager);
        return FilterInvocation.class;
    }

    @Override
    public SecurityMetadataSource obtainSecurityMetadataSource() {
        return dynamicSecurityMetadataSource;
    }
}
