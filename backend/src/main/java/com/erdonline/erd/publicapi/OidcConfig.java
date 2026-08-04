package com.erdonline.erd.publicapi;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/**
 * OIDC 配置门禁。密钥/编解码器不注册为 Bean，避免与会话 JWT 的 {@code SecretKey}/{@code JwtDecoder} 冲突。
 */
@Configuration
@EnableConfigurationProperties(OidcProperties.class)
public class OidcConfig {

    static void assertHmacSafeForProfile(String secret, Environment env) {
        boolean prod = Arrays.asList(env.getActiveProfiles()).contains("prod");
        if (!prod) {
            return;
        }
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "erd.oidc.hmac-secret is blank: set ERD_OIDC_HMAC (≥32 random bytes) for prod");
        }
        if (OidcProperties.INSECURE_DEV_DEFAULT.equals(secret.trim())) {
            throw new IllegalStateException(
                    "ERD_OIDC_HMAC must not use the repository/dev default in prod; rotate to a random secret");
        }
    }

    static String resolveIssuer(OidcProperties props, String martinUiUrl) {
        if (StringUtils.hasText(props.getIssuer())) {
            return trimTrailingSlash(props.getIssuer().trim());
        }
        if (StringUtils.hasText(martinUiUrl)) {
            String first = martinUiUrl.split(",")[0].trim();
            if (StringUtils.hasText(first) && !"*".equals(first)) {
                return trimTrailingSlash(first);
            }
        }
        return "http://localhost:8000";
    }

    private static String trimTrailingSlash(String s) {
        if (s.endsWith("/") && s.length() > 1) {
            return s.substring(0, s.length() - 1);
        }
        return s;
    }

    static SecretKey hmacKey(String secret) {
        byte[] key = secret.getBytes(StandardCharsets.UTF_8);
        if (key.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(key, 0, padded, 0, key.length);
            key = padded;
        }
        return new SecretKeySpec(key, "HmacSHA256");
    }
}
