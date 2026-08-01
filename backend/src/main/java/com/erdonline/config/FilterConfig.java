package com.erdonline.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Servlet 过滤器注册与排序。
 *
 * <p>用 {@link FilterRegistrationBean} 显式排序，保证在 Spring Security 过滤器链之前执行：
 * 网关前缀剥离过滤器（含 CORS 预检短路）优先级最高。</p>
 */
@Configuration
public class FilterConfig {

    @Bean
    public FilterRegistrationBean<GatewayPrefixStripFilter> gatewayPrefixStripFilter() {
        FilterRegistrationBean<GatewayPrefixStripFilter> registration =
                new FilterRegistrationBean<>(new GatewayPrefixStripFilter());
        registration.addUrlPatterns("/*");
        // 必须早于 Spring Security 过滤器链（DelegatingFilterProxy 默认 order = -100），
        // 否则 OPTIONS 预检会先被 OAuth2 授权服务器链拦截为 401
        registration.setOrder(org.springframework.boot.autoconfigure.security.SecurityProperties.DEFAULT_FILTER_ORDER - 10);
        return registration;
    }
}
