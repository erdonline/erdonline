package com.erdonline.common.security.jwt;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "erd.jwt")
public class JwtProperties {
    /**
     * 仅本地/dev DX 默认（application.yml 同串）。prod 必须由 {@code JWT_SECRET} 覆盖，
     * 且不得等于本值（见 {@link JwtConfig#jwtSecretKey}）。
     */
    public static final String INSECURE_DEV_DEFAULT =
            "erd-online-dev-jwt-secret-change-me-32bytes!!";

    /** HS256 密钥，生产必须用环境变量覆盖 */
    private String secret = INSECURE_DEV_DEFAULT;
    /** 秒 */
    private long expiresIn = 12 * 60 * 60L;
    private String issuer = "erd-online";
}
