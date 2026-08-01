package com.erdonline.common.security.jwt;

import com.erdonline.common.core.constant.SecurityConstants;
import com.erdonline.common.security.userdetail.MartinUser;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * JWT 签发：可解码、含用户声明。
 */
class JwtTokenServiceTest {

    private JwtTokenService jwtTokenService;
    private JwtDecoder jwtDecoder;

    @BeforeEach
    void setUp() {
        JwtProperties props = new JwtProperties();
        props.setSecret("erd-online-test-jwt-secret-32bytes-min!!");
        props.setExpiresIn(3600);
        props.setIssuer("erd-online-test");
        byte[] keyBytes = props.getSecret().getBytes(StandardCharsets.UTF_8);
        SecretKey key = new SecretKeySpec(keyBytes, "HmacSHA256");
        jwtTokenService = new JwtTokenService(new NimbusJwtEncoder(new ImmutableSecret<>(key)), props);
        jwtDecoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
    }

    @Test
    void issueProducesDecodableBearerToken() {
        MartinUser user = new MartinUser(
                "uid-1", "dept-1", Set.of("role-a"), "tenant-1", "admin", "pwd",
                true, true, true, true,
                List.of(new SimpleGrantedAuthority("erd_project_page")));

        Map<String, Object> body = jwtTokenService.issue(user);
        assertEquals("Bearer", body.get("token_type"));
        assertNotNull(body.get("access_token"));
        assertEquals(3600L, ((Number) body.get("expires_in")).longValue());

        Jwt jwt = jwtDecoder.decode((String) body.get("access_token"));
        assertEquals("admin", jwt.getSubject());
        assertEquals("uid-1", jwt.getClaimAsString(SecurityConstants.TOKEN_USER_ID));
        assertEquals("erd-online-test", jwt.getClaimAsString("iss"));
        assertTrue(((List<?>) jwt.getClaim("authorities")).contains("erd_project_page"));
    }
}
