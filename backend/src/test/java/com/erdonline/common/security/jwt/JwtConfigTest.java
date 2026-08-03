package com.erdonline.common.security.jwt;

import com.erdonline.common.core.constant.SecurityConstants;
import com.erdonline.common.security.userdetail.MartinUser;
import org.junit.jupiter.api.Test;
import org.springframework.core.convert.converter.Converter;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwsHeader;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * JwtConfig：密钥填充、编解码、JWT→MartinUser 转换、prod 密钥门禁。
 */
class JwtConfigTest {

    private final JwtConfig config = new JwtConfig();

    @Test
    void padsShortSecretTo32Bytes() {
        JwtProperties props = new JwtProperties();
        props.setSecret("short");
        SecretKey key = config.jwtSecretKey(props, new StandardEnvironment());
        assertEquals(32, key.getEncoded().length);
    }

    @Test
    void prodRejectsBlankSecret() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        assertThrows(IllegalStateException.class,
                () -> JwtConfig.assertSecretSafeForProfile("  ", env));
        assertThrows(IllegalStateException.class,
                () -> JwtConfig.assertSecretSafeForProfile(null, env));
    }

    @Test
    void prodRejectsInsecureDevDefault() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> JwtConfig.assertSecretSafeForProfile(JwtProperties.INSECURE_DEV_DEFAULT, env));
        assertTrue(ex.getMessage().contains("repository/dev default"));
    }

    @Test
    void nonProdAllowsInsecureDevDefault() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        JwtConfig.assertSecretSafeForProfile(JwtProperties.INSECURE_DEV_DEFAULT, env);
    }

    @Test
    void converterBuildsMartinUserFromClaims() {
        JwtProperties props = new JwtProperties();
        props.setSecret("erd-online-test-jwt-secret-32bytes-min!!");
        SecretKey key = config.jwtSecretKey(props, new StandardEnvironment());
        JwtEncoder encoder = config.jwtEncoder(key);
        JwtDecoder decoder = config.jwtDecoder(key);

        Instant now = Instant.now();
        String token = encoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(),
                JwtClaimsSet.builder()
                        .issuer("erd")
                        .issuedAt(now)
                        .expiresAt(now.plusSeconds(60))
                        .subject("admin")
                        .claim(SecurityConstants.TOKEN_USER_ID, "u1")
                        .claim(SecurityConstants.TOKEN_DEPT_ID, "d1")
                        .claim(SecurityConstants.TOKEN_TENANT_ID, "t1")
                        .claim(SecurityConstants.TOKEN_ROLE_IDS, List.of("r1", "r2"))
                        .claim("authorities", List.of("a1", "a2"))
                        .build()
        )).getTokenValue();

        Jwt jwt = decoder.decode(token);
        Converter<Jwt, ? extends AbstractAuthenticationToken> converter = config.martinJwtAuthConverter();
        AbstractAuthenticationToken auth = converter.convert(jwt);
        assertInstanceOf(MartinUser.class, auth.getPrincipal());
        MartinUser user = (MartinUser) auth.getPrincipal();
        assertEquals("u1", user.getId());
        assertEquals("admin", user.getUsername());
        assertTrue(user.getRoleIds().contains("r1"));
        assertEquals(2, auth.getAuthorities().size());
    }
}
