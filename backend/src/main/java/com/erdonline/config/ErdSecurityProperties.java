package com.erdonline.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 开源安全相关开关。
 * e2e 种子账号、admin 默认口令与开放注册仅在开发/CI 允许；生产默认拒绝。
 */
@Data
@Component
@ConfigurationProperties(prefix = "erd.security")
public class ErdSecurityProperties {

    /**
     * 是否允许 e2e\\d+ 种子账号登录。生产务必保持 false。
     */
    private boolean e2eAccountsEnabled = false;

    /**
     * 是否允许用户名 {@code admin} 使用 Flyway 种子默认口令 {@code 123456} 登录。
     * 生产务必保持 false；本地 dogfood / 演示可显式 {@code ERD_ALLOW_DEMO_ADMIN=true}。
     */
    private boolean allowDemoAdmin = false;

    /**
     * 是否允许匿名开放注册（产品入口 {@code POST /project/group/user/register}）。
     * 生产务必保持 false；本地 dogfood / E2E 可显式 {@code ERD_ALLOW_OPEN_REGISTER=true}。
     */
    private boolean allowOpenRegister = false;
}
