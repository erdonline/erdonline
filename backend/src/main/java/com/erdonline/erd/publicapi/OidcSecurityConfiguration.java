package com.erdonline.erd.publicapi;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * UserInfo 独立链：匿名可达 + 无 oauth2ResourceServer，
 * 避免会话 JWT Resource Server 把 {@code erd_oat_} 当 JWT 解包失败（WWW-Authenticate invalid_token）。
 * 鉴权在 {@link OidcUserInfoController} 内完成。
 */
@Configuration
public class OidcSecurityConfiguration {

    @Bean
    @Order(0)
    SecurityFilterChain oidcUserInfoSecurityFilterChain(HttpSecurity http) throws Exception {
        http.securityMatcher("/oauth/userinfo", "/auth/oauth/userinfo")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .headers(h -> h.frameOptions(f -> f.deny()));
        return http.build();
    }
}
