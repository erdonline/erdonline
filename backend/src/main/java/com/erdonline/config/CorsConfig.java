package com.erdonline.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;


/**
 * 跨域配置。
 *
 * <p>开发环境前端（:8000）与后端（:9502）分离部署，需要跨域；
 * 生产环境经 nginx 同源反代时不触发跨域。统一放行以简化本地开发与自部署。</p>
 *
 * <p>CorsFilter 以最高优先级注册，确保浏览器的 OPTIONS 预检在进入
 * 前缀剥离过滤器与 Spring Security（OAuth2 授权服务器链会对 /oauth/token 做客户端认证）
 * 之前被直接放行并返回 200，避免预检被 401 拦截。</p>
 */
@Configuration
public class CorsConfig {

    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilterRegistration() {
        CorsConfiguration config = new CorsConfiguration();
        // Spring 5.2(Boot 2.3)无 setAllowedOriginPatterns；此处用通配 origin + 关闭凭证以兼容。
        // 生产/开发的真实跨域由前端代理(同源)承担，此 CORS 仅为直连后端的宽松兜底。
        config.addAllowedOrigin(CorsConfiguration.ALL);
        config.addAllowedHeader(CorsConfiguration.ALL);
        config.addAllowedMethod(CorsConfiguration.ALL);
        config.setAllowCredentials(false);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        FilterRegistrationBean<CorsFilter> registration = new FilterRegistrationBean<>(new CorsFilter(source));
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }
}
