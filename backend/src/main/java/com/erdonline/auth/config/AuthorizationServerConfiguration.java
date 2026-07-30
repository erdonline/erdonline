package com.erdonline.auth.config;

import cn.hutool.core.date.DatePattern;
import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.StrUtil;
import com.erdonline.common.core.constant.SecurityConstants;
import com.erdonline.common.data.tenant.TenantContextHolder;
import com.erdonline.common.security.client.MartinClientDetailsService;
import com.erdonline.common.security.component.MartinOauthResponseExceptionTranslator;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.common.security.userdetail.MartinUserDetailsService;
import com.erdonline.common.vip.license.LicenseManagerHolder;
import com.erdonline.common.vip.license.LicenseVerify;
import de.schlichtherle.license.LicenseContent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.oauth2.common.DefaultOAuth2AccessToken;
import org.springframework.security.oauth2.config.annotation.configurers.ClientDetailsServiceConfigurer;
import org.springframework.security.oauth2.config.annotation.web.configuration.AuthorizationServerConfigurerAdapter;
import org.springframework.security.oauth2.config.annotation.web.configuration.EnableAuthorizationServer;
import org.springframework.security.oauth2.config.annotation.web.configurers.AuthorizationServerEndpointsConfigurer;
import org.springframework.security.oauth2.config.annotation.web.configurers.AuthorizationServerSecurityConfigurer;
import org.springframework.security.oauth2.provider.ClientDetailsService;
import org.springframework.security.oauth2.provider.OAuth2Authentication;
import org.springframework.security.oauth2.provider.token.DefaultAuthenticationKeyGenerator;
import org.springframework.security.oauth2.provider.token.TokenEnhancer;
import org.springframework.security.oauth2.provider.token.TokenStore;
import org.springframework.security.oauth2.provider.token.store.redis.RedisTokenStore;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/5/17
 * @describtion AuthorizationServerConfiguration
 * @since 1.0
 */
@Slf4j
@Configuration
@EnableAuthorizationServer
public class AuthorizationServerConfiguration extends AuthorizationServerConfigurerAdapter {
    @Autowired
    AuthenticationManager authenticationManager;
    @Autowired
    RedisConnectionFactory redisConnectionFactory;
    @Autowired
    private MartinUserDetailsService martinUserDetailsService;
    @Autowired
    private DataSource dataSource;

    @Override
    public void configure(ClientDetailsServiceConfigurer clients) throws Exception {
        clients.withClientDetails(clientDetails());
    }

    @Bean
    public ClientDetailsService clientDetails() {
        return new MartinClientDetailsService(dataSource);
    }

    @Override
    public void configure(AuthorizationServerEndpointsConfigurer endpoints) {
        endpoints
                .tokenStore(tokenStore())
                .tokenEnhancer(tokenEnhancer())
                .authenticationManager(authenticationManager)
                .userDetailsService(martinUserDetailsService)
                .exceptionTranslator(new MartinOauthResponseExceptionTranslator())
                .allowedTokenEndpointRequestMethods(HttpMethod.GET, HttpMethod.POST);
    }

    @Bean
    public TokenStore tokenStore() {
        RedisTokenStore tokenStore = new RedisTokenStore(redisConnectionFactory);
        tokenStore.setPrefix(SecurityConstants.MARTIN_PREFIX + SecurityConstants.OAUTH_PREFIX);
        tokenStore.setAuthenticationKeyGenerator(new DefaultAuthenticationKeyGenerator() {
            @Override
            public String extractKey(OAuth2Authentication authentication) {
                return super.extractKey(authentication) + StrUtil.COLON + TenantContextHolder.getTenantId();
            }
        });
        return tokenStore;
    }

    /**
     * token增强，客户端模式不增强。
     *
     * @return TokenEnhancer
     */
    @Bean
    public TokenEnhancer tokenEnhancer() {
        return (accessToken, authentication) -> {
            if (SecurityConstants.CLIENT_CREDENTIALS
                    .equals(authentication.getOAuth2Request().getGrantType())) {
                return accessToken;
            }
            final Map<String, Object> additionalInfo = new HashMap<>(16);
            MartinUser martinUser = (MartinUser) authentication.getUserAuthentication().getPrincipal();
            additionalInfo.put(SecurityConstants.TOKEN_USER_ID, martinUser.getId());
            additionalInfo.put(SecurityConstants.TOKEN_USERNAME, martinUser.getUsername());
            additionalInfo.put(SecurityConstants.TOKEN_DEPT_ID, martinUser.getDeptId());
            additionalInfo.put(SecurityConstants.TOKEN_ROLE_IDS, martinUser.getRoleIds());
            additionalInfo.put(SecurityConstants.TOKEN_TENANT_ID, martinUser.getTenantId());
            additionalInfo.put(SecurityConstants.TOKEN_LICENSE, SecurityConstants.MARTIN_LICENSE);
            LicenseContent licenseContent = LicenseVerify.licenseContent();
            if (licenseContent != null) {
                additionalInfo.put(SecurityConstants.LICENSE_TO, licenseContent.getInfo());
                additionalInfo.put(SecurityConstants.LICENSED_START_TIME, DateUtil.format(licenseContent.getNotBefore(), DatePattern.NORM_DATETIME_FORMAT));
                additionalInfo.put(SecurityConstants.LICENSED_END_TIME, DateUtil.format(licenseContent.getNotAfter(), DatePattern.NORM_DATETIME_FORMAT));
            }else {
                additionalInfo.put(SecurityConstants.LICENSE_TO, "");
                additionalInfo.put(SecurityConstants.LICENSED_START_TIME, "");
                additionalInfo.put(SecurityConstants.LICENSED_END_TIME, "");

            }
            ((DefaultOAuth2AccessToken) accessToken).setAdditionalInformation(additionalInfo);
            return accessToken;
        };
    }


    @Override
    public void configure(AuthorizationServerSecurityConfigurer oauthServer) {
        // 配置token获取和验证时的策略
        oauthServer.tokenKeyAccess("permitAll()")
                .checkTokenAccess("isAuthenticated()")
                // 单体化后上下文存在多个 PasswordEncoder bean，显式指定客户端密钥校验用的编码器（内联构造，不注册为 bean），
                // 保证能匹配 db 中 {bcrypt} 前缀的 client_secret
                .passwordEncoder(org.springframework.security.crypto.factory.PasswordEncoderFactories.createDelegatingPasswordEncoder())
                .allowFormAuthenticationForClients();
    }


}
