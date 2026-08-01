package com.erdonline.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * 密码编码器配置。
 *
 * <p>独立成配置类，避免与 {@code ErdSecurityConfiguration}、
 * {@code MartinUserDetailsService}、用户服务形成循环依赖。</p>
 *
 * <p>使用 DelegatingPasswordEncoder：库中密码以 {@code {bcrypt}} 等前缀标识算法，
 * 校验与编码时按前缀路由到对应实现。</p>
 *
 * @author ERD Online
 */
@Configuration
public class PasswordEncoderConfig {

    /**
     * 创建支持多算法前缀的密码编码器。
     *
     * @return DelegatingPasswordEncoder 实例，不可为 null
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }
}
