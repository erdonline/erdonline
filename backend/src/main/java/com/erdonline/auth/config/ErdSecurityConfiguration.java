package com.erdonline.auth.config;

import com.erdonline.common.security.dynamic.RestAuthenticationEntryPoint;
import com.erdonline.common.security.dynamic.RestfulAccessDeniedHandler;
import com.erdonline.common.security.properties.PermitAllUrlProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
                    for (String url : ignore) {
                        auth.requestMatchers(url).permitAll();
                    }
                    auth.anyRequest().authenticated();
                })
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(martinJwtAuthConverter)))
                .headers(h -> h.frameOptions(f -> f.disable()));
        return http.build();
    }
}
