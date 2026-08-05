package com.erdonline.erd.publicapi;

import com.erdonline.config.CrossOriginPolicy;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.util.StringUtils;

/**
 * OIDC 配置门禁。RSA 密钥与编解码器不注册为 Bean，避免与会话 JWT 冲突。
 */
@Configuration
@EnableConfigurationProperties(OidcProperties.class)
public class OidcConfig {

    /**
     * Issuer 解析优先级：{@code erd.oidc.issuer}（{@code ERD_OIDC_ISSUER}）显式值 →
     * {@code martin.ui.url}（{@code ERD_UI_URL}）CSV 中**第一个合法 http(s) Origin**
     * （CORS 允许多源，但 issuer/JWKS `iss` 须单值；跳过通配 {@code *} 与打字错误如
     * {@code ttps://} 掉字母的畸形条目）→ 均无则 dev 回落 localhost，prod fail-fast。
     */
    static String resolveIssuer(OidcProperties props, String martinUiUrl, Environment env) {
        if (StringUtils.hasText(props.getIssuer())) {
            return trimTrailingSlash(props.getIssuer().trim());
        }
        if (StringUtils.hasText(martinUiUrl)) {
            for (String candidate : martinUiUrl.split(",")) {
                String trimmed = candidate.trim();
                if (CrossOriginPolicy.isWellFormedHttpOrigin(trimmed)) {
                    return trimTrailingSlash(trimmed);
                }
            }
        }
        if (env != null && CrossOriginPolicy.isProd(env)) {
            throw new IllegalStateException(
                    "no valid OIDC issuer: set ERD_OIDC_ISSUER, or ensure ERD_UI_URL contains at least one "
                            + "well-formed http(s) origin (got martin.ui.url='" + martinUiUrl + "')");
        }
        return "http://localhost:8000";
    }

    private static String trimTrailingSlash(String s) {
        if (s.endsWith("/") && s.length() > 1) {
            return s.substring(0, s.length() - 1);
        }
        return s;
    }
}
