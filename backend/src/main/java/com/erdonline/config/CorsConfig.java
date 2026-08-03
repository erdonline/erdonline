package com.erdonline.config;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.env.Environment;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;


/**
 * 跨域配置。
 *
 * <p>开发环境前端（:8000）与后端（:9502）分离部署，需要跨域；
 * 生产环境经 nginx 同源反代时不触发跨域。</p>
 *
 * <p>CorsFilter 以最高优先级注册，确保浏览器的 OPTIONS 预检在进入
 * 前缀剥离过滤器与 Spring Security 之前被直接放行并返回 200，避免预检被 401 拦截。</p>
 *
 * <p>Origin 解析见 {@link CrossOriginPolicy}（R-CFG-04）：本地默认 localhost；
 * prod 须 {@code ERD_UI_URL}（{@code martin.ui.url}），禁止 {@code *}。</p>
 */
@Configuration
public class CorsConfig {

    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilterRegistration(Environment env) {
        CorsConfiguration config = new CorsConfiguration();
        // 认证为 Bearer token（非 Cookie），且 allowCredentials=false，浏览器不会附带凭证。
        List<String> origins = CrossOriginPolicy.resolveHttpAllowedOrigins(env);
        for (String origin : origins) {
            config.addAllowedOrigin(origin);
        }
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
