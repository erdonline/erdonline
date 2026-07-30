package com.erdonline.common.security.config;

import com.erdonline.common.security.dynamic.DynamicSecurityFilter;
import com.erdonline.common.security.properties.PermitAllUrlProperties;
import com.erdonline.common.security.properties.RemoteTokenServiceProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.ExpressionUrlAuthorizationConfigurer;
import org.springframework.security.web.access.intercept.FilterSecurityInterceptor;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * @author: 零代科技
 * @version: 1.0
 * @date: 2023/7/9 14:35
 * @describtion: HttpSecurityDealer
 */
@Slf4j
@Configuration
public class HttpSecurityDealer {

    public ExpressionUrlAuthorizationConfigurer<HttpSecurity>.ExpressionInterceptUrlRegistry martinExpressionInterceptUrlRegistry(HttpSecurity httpSecurity, List<String> ignoreUrls) throws Exception {
        httpSecurity.headers().frameOptions().disable();
        ExpressionUrlAuthorizationConfigurer<HttpSecurity>
                .ExpressionInterceptUrlRegistry registry = httpSecurity
                .authorizeRequests();
        log.debug("MartinSecurityAutoConfiguration ignoreUrls : {}", ignoreUrls);
        ignoreUrls.forEach(url -> registry.antMatchers(url).permitAll());

        //允许跨域请求的OPTIONS请求
        registry.antMatchers(HttpMethod.OPTIONS)
                .permitAll();
        registry.antMatchers(
                "/",
                "/error",
                "/endpoint/**",
                "/endpoint/**",
                "/endpoint/**",
                "/v2/api-docs",           // swagger
                "/webjars/**",            // swagger-ui webjars
                "/swagger-resources/**",  // swagger-ui resources
                "/configuration/**",      // swagger configuration
                "/*.html",
                "/favicon.ico",
                "/**/*.html",
                "/**/*.css",
                "/**/*.js"
        ).permitAll();
        return registry;
    }

}
