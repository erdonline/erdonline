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
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * OIDC id_token（HS256）。仅当授予 {@link PatScopes#OPENID} 时由 auth code / refresh 换票签发。
 * <ul>
 *   <li>{@code nonce}：仅 authorization_code 路径（来自 authorize 绑定）；refresh 不带（OIDC Core §12.2）</li>
 *   <li>{@code at_hash}：按 access_token 计算（OIDC Core §3.1.3.6；HS256 → SHA-256 左半 + base64url）</li>
 * </ul>
 */
@Service
public class OidcIdTokenService {

    static final int NONCE_MAX_LEN = 255;

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
     * @param nonce            authorize 绑定的 nonce；空则不写入 claim（refresh 应传 null）
     * @param accessTokenPlain 同响应的 access_token；用于 {@code at_hash}；空则省略 at_hash
     * @return compact JWT，或 scopes 不含 openid 时 {@code null}
     */
    public String mintIfOpenid(
            Set<String> grantedScopes,
            String clientId,
            String userId,
            String username,
            String nonce,
            String accessTokenPlain) {
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
        if (StringUtils.hasText(nonce)) {
            claims.claim("nonce", nonce.trim());
        }
        if (StringUtils.hasText(accessTokenPlain)) {
            claims.claim("at_hash", atHashHs256(accessTokenPlain));
        }
        return oidcJwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(),
                claims.build()
        )).getTokenValue();
    }

    /**
     * OIDC Core §3.1.3.6：对 access_token ASCII 做 SHA-256，取左半（128 bit）再 base64url（无填充）。
     * 与 id_token 签名算法 HS256 对齐。
     */
    static String atHashHs256(String accessTokenPlain) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(accessTokenPlain.getBytes(StandardCharsets.US_ASCII));
            byte[] left = Arrays.copyOf(digest, digest.length / 2);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(left);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    /** authorize 可选 nonce：空 OK；超长拒绝。 */
    public static String normalizeNonce(String nonce) {
        if (!StringUtils.hasText(nonce)) {
            return null;
        }
        String n = nonce.trim();
        if (n.length() > NONCE_MAX_LEN) {
            throw new IllegalArgumentException("invalid_request:nonce");
        }
        return n;
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
