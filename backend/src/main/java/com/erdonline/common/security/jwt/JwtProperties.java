package com.erdonline.common.security.jwt;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "erd.jwt")
public class JwtProperties {
    /** HS256 密钥，生产必须用环境变量覆盖 */
    private String secret = "erd-online-dev-jwt-secret-change-me-32bytes!!";
    /** 秒 */
    private long expiresIn = 12 * 60 * 60L;
    private String issuer = "erd-online";
}
