package com.erdonline.auth.config;

import com.erdonline.common.security.userdetail.MartinUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * 认证管理器配置。
 *
 * <p>{@link MartinUserDetailsService} 使用 {@link Lazy} 注入，打断
 * Security → UserDetails → 用户服务 → PasswordEncoder 的循环依赖。</p>
 *
 * @author ERD Online
 */
@Configuration
public class AuthManagerConfig {

    /**
     * 基于 DaoAuthenticationProvider 的认证管理器。
     *
     * @param martinUserDetailsService 用户加载服务（懒加载）
     * @param passwordEncoder          密码编码器
     * @return AuthenticationManager，不可为 null
     */
    @Bean
    public AuthenticationManager authenticationManager(
            @Lazy MartinUserDetailsService martinUserDetailsService,
            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(martinUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }
}
