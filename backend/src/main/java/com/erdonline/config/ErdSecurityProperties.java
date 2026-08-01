package com.erdonline.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 开源安全相关开关。
 * e2e 种子账号（e2e0..e2e9）仅在开发/CI 允许登录，生产默认拒绝。
 */
@Data
@Component
@ConfigurationProperties(prefix = "erd.security")
public class ErdSecurityProperties {

    /**
     * 是否允许 e2e\\d+ 种子账号登录。生产务必保持 false。
     */
    private boolean e2eAccountsEnabled = false;
}
