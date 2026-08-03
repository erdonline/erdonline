package com.erdonline.common.security.jwt;

import com.erdonline.common.core.constant.SecurityConstants;
import com.erdonline.common.security.userdetail.MartinUser;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class JwtConfig {

    @Bean
    SecretKey jwtSecretKey(JwtProperties props, Environment env) {
        assertSecretSafeForProfile(props.getSecret(), env);
        byte[] key = props.getSecret().getBytes(StandardCharsets.UTF_8);
        if (key.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(key, 0, padded, 0, key.length);
            key = padded;
        }
        return new SecretKeySpec(key, "HmacSHA256");
    }

    /**
     * prod：拒绝 blank / 仓库开发默认串（即使显式设了 {@code JWT_SECRET}）。
     * 非 prod：允许 application.yml 弱默认，保障本地 {@code dev-ensure}。
     */
    static void assertSecretSafeForProfile(String secret, Environment env) {
        boolean prod = Arrays.asList(env.getActiveProfiles()).contains("prod");
        if (!prod) {
            return;
        }
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "erd.jwt.secret is blank: set JWT_SECRET (≥32 random bytes) for prod");
        }
        if (JwtProperties.INSECURE_DEV_DEFAULT.equals(secret.trim())) {
            throw new IllegalStateException(
                    "JWT_SECRET must not use the repository/dev default in prod; rotate to a random secret");
        }
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey jwtSecretKey) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(jwtSecretKey));
    }

    @Bean
    JwtDecoder jwtDecoder(SecretKey jwtSecretKey) {
        return NimbusJwtDecoder.withSecretKey(jwtSecretKey).macAlgorithm(MacAlgorithm.HS256).build();
    }

    @Bean
    Converter<Jwt, ? extends AbstractAuthenticationToken> martinJwtAuthConverter() {
        return jwt -> {
            List<SimpleGrantedAuthority> authorities;
            Object raw = jwt.getClaim("authorities");
            if (raw instanceof Collection<?> col) {
                authorities = col.stream().map(String::valueOf).map(SimpleGrantedAuthority::new).collect(Collectors.toList());
            } else {
                authorities = List.of();
            }
            Object roleRaw = jwt.getClaim(SecurityConstants.TOKEN_ROLE_IDS);
            Set<String> roleIds = new HashSet<>();
            if (roleRaw instanceof Collection<?> col) {
                col.forEach(r -> roleIds.add(String.valueOf(r)));
            }
            MartinUser user = new MartinUser(
                    str(jwt.getClaim(SecurityConstants.TOKEN_USER_ID)),
                    str(jwt.getClaim(SecurityConstants.TOKEN_DEPT_ID)),
                    roleIds,
                    str(jwt.getClaim(SecurityConstants.TOKEN_TENANT_ID)),
                    jwt.getSubject(),
                    "N/A",
                    true, true, true, true,
                    authorities
            );
            return new UsernamePasswordAuthenticationToken(user, jwt.getTokenValue(), authorities);
        };
    }

    private static String str(Object v) {
        return v == null ? null : String.valueOf(v);
    }
}
