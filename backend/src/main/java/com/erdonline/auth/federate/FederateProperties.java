package com.erdonline.auth.federate;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

/**
 * 第三方 IdP 联邦配置（ADR-0021）。缺凭证 → provider 关闭，不阻断启动。
 */
@Data
@ConfigurationProperties(prefix = "erd.federate")
public class FederateProperties {

    private Github github = new Github();
    private Google google = new Google();
    private Wechat wechat = new Wechat();

    /**
     * 回调成功后浏览器落点（UI origin 下的路径前缀外的完整 base 由 {@code martin.ui.url} 提供）。
     * 默认 {@code /login/federate}。
     */
    private String successPath = "/login/federate";

    public boolean isGithubEnabled() {
        return StringUtils.hasText(github.getClientId())
                && StringUtils.hasText(github.getClientSecret())
                && StringUtils.hasText(github.getRedirectUri());
    }

    public boolean isGoogleEnabled() {
        return StringUtils.hasText(google.getClientId())
                && StringUtils.hasText(google.getClientSecret())
                && StringUtils.hasText(google.getRedirectUri());
    }

    public boolean isWechatEnabled() {
        return StringUtils.hasText(wechat.getAppId())
                && StringUtils.hasText(wechat.getAppSecret())
                && StringUtils.hasText(wechat.getRedirectUri());
    }

    public boolean isEnabled(FederateProvider provider) {
        return switch (provider) {
            case GITHUB -> isGithubEnabled();
            case GOOGLE -> isGoogleEnabled();
            case WECHAT -> isWechatEnabled();
        };
    }

    @Data
    public static class Github {
        private String clientId = "";
        private String clientSecret = "";
        /** 须与 GitHub OAuth App Authorization callback URL 一致 */
        private String redirectUri = "";
    }

    @Data
    public static class Google {
        private String clientId = "";
        private String clientSecret = "";
        /** 须与 Google Console 一致，建议直指后端，如 http://localhost:9502/auth/federate/google/callback */
        private String redirectUri = "";
    }

    @Data
    public static class Wechat {
        /** 微信开放平台网站应用 AppID */
        private String appId = "";
        private String appSecret = "";
        /** 须与开放平台授权回调域一致 */
        private String redirectUri = "";
    }
}
