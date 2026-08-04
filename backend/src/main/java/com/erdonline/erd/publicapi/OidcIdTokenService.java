package com.erdonline.erd.publicapi;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * OIDC id_token（HS256）。仅当授予 {@link PatScopes#OPENID} 时由 auth code / refresh 换票签发。
 */
@Service
public class OidcIdTokenService {

    private final OidcProperties oidcProperties;
    private final Environment environment;
    private final String martinUiUrl;
    private JwtEncoder oidcJwtEncoder;
    private JwtDecoder oidcJwtDecoder;

    @Autowired
    public OidcIdTokenService(
            OidcProperties oidcProperties,
            Environment environment,
            @Value("${martin.ui.url:http://localhost:8000}") String martinUiUrl) {
        this.oidcProperties = oidcProperties;
        this.environment = environment;
        this.martinUiUrl = martinUiUrl;
    }

    /** 单测用 */
    OidcIdTokenService(JwtEncoder encoder, JwtDecoder decoder, OidcProperties props, String martinUiUrl) {
        this.oidcProperties = props;
        this.environment = null;
        this.martinUiUrl = martinUiUrl;
        this.oidcJwtEncoder = encoder;
        this.oidcJwtDecoder = decoder;
    }

    @PostConstruct
    void init() {
        if (oidcJwtEncoder != null) {
            return;
        }
        OidcConfig.assertHmacSafeForProfile(oidcProperties.getHmacSecret(), environment);
        SecretKey key = OidcConfig.hmacKey(oidcProperties.getHmacSecret());
        this.oidcJwtEncoder = new NimbusJwtEncoder(new ImmutableSecret<>(key));
        this.oidcJwtDecoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
    }

    public String issuer() {
        return OidcConfig.resolveIssuer(oidcProperties, martinUiUrl);
    }

    public long idTokenTtlSeconds() {
        return Math.max(60, oidcProperties.getIdTokenTtlSeconds());
    }

    /**
     * @return compact JWT，或 scopes 不含 openid 时 {@code null}
     */
    public String mintIfOpenid(
            Set<String> grantedScopes,
            String clientId,
            String userId,
            String username) {
        if (!PatScopes.has(grantedScopes, PatScopes.OPENID)) {
            return null;
        }
        if (!StringUtils.hasText(clientId) || !StringUtils.hasText(userId)) {
            return null;
        }
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(idTokenTtlSeconds());
        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .issuer(issuer())
                .subject(userId)
                .audience(java.util.List.of(clientId))
                .issuedAt(now)
                .expiresAt(exp)
                .claim("preferred_username", username != null ? username : "");
        return oidcJwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(),
                claims.build()
        )).getTokenValue();
    }

    /** 校验并解析 id_token（单测 / dogfood）。 */
    public Jwt decode(String idToken) {
        return oidcJwtDecoder.decode(idToken);
    }

    public Map<String, Object> userInfoClaims(String userId, String username) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("sub", userId);
        body.put("preferred_username", username != null ? username : "");
        body.put("name", username != null ? username : "");
        return body;
    }
}
