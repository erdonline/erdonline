package com.erdonline.erd.publicapi;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * OIDC 薄 MVP：HS256 id_token 共享密钥（与会话 JWT 分离）。
 * prod 须 {@code ERD_OIDC_HMAC} 且不得等于开发默认串。
 */
@Data
@ConfigurationProperties(prefix = "erd.oidc")
public class OidcProperties {

    public static final String INSECURE_DEV_DEFAULT =
            "erd-online-dev-oidc-hmac-change-me-32bytes!!";

    /**
     * Issuer（无尾斜杠）。空则回落 {@code martin.ui.url} 首项（通常 = {@code ERD_UI_URL}）。
     * 本地直连 API dogfood：设 {@code ERD_OIDC_ISSUER=http://127.0.0.1:9502}。
     */
    private String issuer = "";

    /** HS256 密钥；生产必须用环境变量覆盖 */
    private String hmacSecret = INSECURE_DEV_DEFAULT;

    /** id_token TTL（秒）；默认与 OAT 同量级 */
    private long idTokenTtlSeconds = 3600L;
}
