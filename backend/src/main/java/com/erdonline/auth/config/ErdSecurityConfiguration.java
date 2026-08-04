package com.erdonline.auth.config;

import com.erdonline.common.security.dynamic.RestAuthenticationEntryPoint;
import com.erdonline.common.security.dynamic.RestfulAccessDeniedHandler;
import com.erdonline.common.security.properties.PermitAllUrlProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.SecurityFilterChain;

import java.util.ArrayList;
import java.util.List;

/**
 * Spring Security 6 过滤器链：JWT Resource Server + 白名单放行。
 * AuthenticationManager 见 {@link AuthManagerConfig}。
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class ErdSecurityConfiguration {

    private final PermitAllUrlProperties permitAllUrlProperties;
    private final Converter<Jwt, ? extends AbstractAuthenticationToken> martinJwtAuthConverter;

    @Bean
    @Order(2)
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        List<String> ignore = new ArrayList<>(permitAllUrlProperties.getIgnoreUrls() == null
                ? List.of() : permitAllUrlProperties.getIgnoreUrls());
        ignore.addAll(List.of(
                "/login", "/auth/login",
                "/actuator/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html",
                "/error", "/**/*.js", "/**/*.css", "/**/*.html", "/favicon.ico"
        ));

        http.csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(new RestAuthenticationEntryPoint())
                        .accessDeniedHandler(new RestfulAccessDeniedHandler()))
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
                    // 只读分享：匿名仅 GET /share/{token}（及 /ncnb 前缀变体）；写操作需登录
                    auth.requestMatchers(HttpMethod.GET, "/share/*", "/ncnb/share/*").permitAll();
                    for (String url : ignore) {
                        auth.requestMatchers(url).permitAll();
                    }
                    auth.anyRequest().authenticated();
                })
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(martinJwtAuthConverter)))
                // R-AUTH-07：默认 DENY 防点击劫持。只读分享是 SPA 路由 /share/:token，不 iframe 嵌 API；
                // 若将来需第三方嵌 UI，由前端托管层 CSP frame-ancestors 放行，勿对本过滤器链关掉 frameOptions。
                .headers(h -> h.frameOptions(f -> f.deny()));
        return http.build();
    }
}
