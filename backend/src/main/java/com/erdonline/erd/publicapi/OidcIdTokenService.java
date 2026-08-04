package com.erdonline.erd.publicapi;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

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
 * OIDC id_token（RS256）。仅当授予 {@link PatScopes#OPENID} 时由 auth code / refresh 换票签发。
 * <ul>
 *   <li>{@code nonce}：仅 authorization_code 路径（来自 authorize 绑定）；refresh 不带（OIDC Core §12.2）</li>
 *   <li>{@code at_hash}：按 access_token 计算（OIDC Core §3.1.3.6；RS256 → SHA-256 左半 + base64url）</li>
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
    private OidcRsaKeySupport.Loaded rsa;
    private String signingKeyId;
    private Map<String, Object> testJwksDocument;

    @Autowired
    public OidcIdTokenService(
            OidcProperties oidcProperties,
            Environment environment,
            @Value("${martin.ui.url:http://localhost:8000}") String martinUiUrl) {
        this.oidcProperties = oidcProperties;
        this.environment = environment;
        this.martinUiUrl = martinUiUrl;
    }

    /** 单测用（预注入 encoder/decoder/JWKS）。 */
    OidcIdTokenService(
            JwtEncoder encoder,
            JwtDecoder decoder,
            OidcProperties props,
            String martinUiUrl,
            String kid,
            Map<String, Object> jwksDocument) {
        this.oidcProperties = props;
        this.environment = null;
        this.martinUiUrl = martinUiUrl;
        this.oidcJwtEncoder = encoder;
        this.oidcJwtDecoder = decoder;
        this.signingKeyId = kid;
        this.testJwksDocument = jwksDocument;
    }

    @PostConstruct
    void init() {
        if (oidcJwtEncoder != null) {
            return;
        }
        this.rsa = OidcRsaKeySupport.load(oidcProperties, environment);
        this.oidcJwtEncoder = rsa.encoder();
        this.oidcJwtDecoder = rsa.decoder();
        this.signingKeyId = rsa.keyId();
    }

    public String issuer() {
        return OidcConfig.resolveIssuer(oidcProperties, martinUiUrl);
    }

    public long idTokenTtlSeconds() {
        return Math.max(60, oidcProperties.getIdTokenTtlSeconds());
    }

    /** JWKS 文档（仅公钥；含 kid）。 */
    public Map<String, Object> jwksDocument() {
        if (testJwksDocument != null) {
            return testJwksDocument;
        }
        return rsa.jwksDocument();
    }

    public String signingKeyId() {
        return signingKeyId;
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
            claims.claim("at_hash", atHashRs256(accessTokenPlain));
        }
        JwsHeader.Builder header = JwsHeader.with(SignatureAlgorithm.RS256);
        if (StringUtils.hasText(signingKeyId)) {
            header.keyId(signingKeyId);
        }
        return oidcJwtEncoder.encode(JwtEncoderParameters.from(
                header.build(),
                claims.build()
        )).getTokenValue();
    }

    /**
     * OIDC Core §3.1.3.6：对 access_token ASCII 做 SHA-256，取左半（128 bit）再 base64url（无填充）。
     * RS256 与历史 HS256 均用 SHA-256。
     */
    static String atHashRs256(String accessTokenPlain) {
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
