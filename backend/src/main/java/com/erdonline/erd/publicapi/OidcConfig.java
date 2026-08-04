package com.erdonline.erd.publicapi;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

/**
 * OIDC 配置门禁。RSA 密钥与编解码器不注册为 Bean，避免与会话 JWT 冲突。
 */
@Configuration
@EnableConfigurationProperties(OidcProperties.class)
public class OidcConfig {

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
}
