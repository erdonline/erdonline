package com.erdonline.erd.publicapi;

import com.erdonline.common.security.dynamic.RestAuthenticationEntryPoint;
import com.erdonline.common.security.dynamic.RestfulAccessDeniedHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * 公开 API 独立过滤器链：仅 PAT，不吃会话 JWT。
 */
@Configuration
public class PublicApiSecurityConfiguration {

    @Bean
    PublicApiRateLimiter publicApiRateLimiter(
            RedissonClient redisson,
            @Value("${erd.public-api.rate-limit-per-minute:60}") int limitPerMinute) {
        return new PublicApiRateLimiter(redisson, limitPerMinute);
    }

    @Bean
    PatAuthenticationFilter patAuthenticationFilter(
            PersonalAccessTokenService personalAccessTokenService,
            ObjectMapper objectMapper) {
        return new PatAuthenticationFilter(personalAccessTokenService, objectMapper);
    }

    @Bean
    PublicApiRateLimitFilter publicApiRateLimitFilter(
            PublicApiRateLimiter publicApiRateLimiter,
            ObjectMapper objectMapper) {
        return new PublicApiRateLimitFilter(publicApiRateLimiter, objectMapper);
    }

    @Bean
    @Order(1)
    SecurityFilterChain publicApiSecurityFilterChain(
            HttpSecurity http,
            PatAuthenticationFilter patAuthenticationFilter,
            PublicApiRateLimitFilter publicApiRateLimitFilter) throws Exception {
        http.securityMatcher("/api/v1/**")
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(new RestAuthenticationEntryPoint())
                        .accessDeniedHandler(new RestfulAccessDeniedHandler()))
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
                    auth.anyRequest().authenticated();
                })
                .addFilterBefore(patAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(publicApiRateLimitFilter, PatAuthenticationFilter.class)
                .headers(h -> h.frameOptions(f -> f.deny()));
        return http.build();
    }
}
