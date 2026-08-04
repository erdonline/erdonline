package com.erdonline.erd.publicapi;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * OIDC：RS256 id_token + JWKS（与会话 JWT_SECRET 分离）。
 * <p>
 * 密钥优先级：{@code ERD_OIDC_RSA_PRIVATE_KEY}（PEM）→
 * {@code ERD_OIDC_RSA_PRIVATE_KEY_PATH}（PEM 文件）→
 * {@code ERD_OIDC_RSA_KEYSTORE_PATH}（PKCS12）→
 * 非 prod 自动生成到 {@code ~/.erdonline/oidc-rsa-private.pem}。
 * prod 无可用密钥则 fail-fast（对齐 JWT_SECRET）。
 */
@Data
@ConfigurationProperties(prefix = "erd.oidc")
public class OidcProperties {

    /**
     * Issuer（无尾斜杠）。空则回落 {@code martin.ui.url} 首项（通常 = {@code ERD_UI_URL}）。
     * 本地直连 API dogfood：设 {@code ERD_OIDC_ISSUER=http://127.0.0.1:9502}。
     */
    private String issuer = "";

    /** PKCS#8 / PKCS#1 PEM 私钥全文（环境变量宜用字面量或挂密）。 */
    private String rsaPrivateKey = "";

    /** PEM 私钥文件路径（仓外；勿把私钥提交进仓库）。 */
    private String rsaPrivateKeyPath = "";

    /** 可选 PKCS12 keystore 路径。 */
    private String rsaKeystorePath = "";

    /** PKCS12 密码；可空。 */
    private String rsaKeystorePassword = "";

    /** PKCS12 别名；空则取 keystore 第一个 key 条目。 */
    private String rsaKeyAlias = "";

    /**
     * JWK {@code kid}；空则用公钥 JWK thumbprint（RFC 7638）。
     */
    private String rsaKeyId = "";

    /** id_token TTL（秒）；默认与 OAT 同量级 */
    private long idTokenTtlSeconds = 3600L;
}
