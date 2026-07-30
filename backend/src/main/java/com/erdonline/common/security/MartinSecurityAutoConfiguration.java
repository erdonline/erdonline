package com.erdonline.common.security;

import cn.hutool.core.convert.Convert;
import com.erdonline.common.security.config.HttpSecurityDealer;
import com.erdonline.common.security.properties.PermitAllUrlProperties;
import com.erdonline.common.security.properties.RemoteTokenServiceProperties;
import com.erdonline.common.security.component.ResourceAuthExceptionEntryPoint;
import com.erdonline.common.security.dynamic.DynamicAccessDecisionManager;
import com.erdonline.common.security.dynamic.DynamicSecurityFilter;
import com.erdonline.common.security.dynamic.DynamicSecurityMetadataSource;
import com.erdonline.common.security.dynamic.RestAuthenticationEntryPoint;
import com.erdonline.common.security.dynamic.RestfulAccessDeniedHandler;
import com.erdonline.common.security.handler.RestResponseErrorHandler;
import com.erdonline.common.security.provider.token.MartinUserAuthenticationConverter;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.ExpressionUrlAuthorizationConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.config.annotation.web.configuration.EnableResourceServer;
import org.springframework.security.oauth2.config.annotation.web.configuration.ResourceServerConfigurerAdapter;
import org.springframework.security.oauth2.config.annotation.web.configurers.ResourceServerSecurityConfigurer;
import org.springframework.security.oauth2.provider.token.DefaultAccessTokenConverter;
import org.springframework.security.oauth2.provider.token.DefaultTokenServices;
import org.springframework.security.oauth2.provider.token.TokenStore;
import org.springframework.security.oauth2.provider.token.UserAuthenticationConverter;
import org.springframework.security.web.access.intercept.FilterSecurityInterceptor;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.ArrayList;
import java.util.Map;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/5/29
 * @describtion 自动配置Martin安全服务
 * @since 1.0
 */
@Slf4j
@Configuration
@EnableCaching
@EnableConfigurationProperties({PermitAllUrlProperties.class,RemoteTokenServiceProperties.class})
@ConditionalOnProperty(
        prefix = "martin.resource-server",
        name = {"enabled"},
        havingValue = "true",
        matchIfMissing = true
)
@EnableResourceServer
@ComponentScan(basePackages = {"com.erdonline.common.security", "com.erdonline.common.core"})
public class MartinSecurityAutoConfiguration extends ResourceServerConfigurerAdapter implements WebMvcConfigurer, ApplicationContextAware {

    @Autowired
    private RemoteTokenServiceProperties remoteTokenServiceProperties;
    @Autowired
    private ResourceAuthExceptionEntryPoint resourceAuthExceptionEntryPoint;
    @Autowired
    private TokenStore tokenStore;
    private ApplicationContext applicationContext;

    @Autowired
    private HttpSecurityDealer httpSecurityDealer;

    @Autowired
    private PermitAllUrlProperties permitAllUrlProperties;

    /**
     * 默认的配置，对外暴露
     *
     * @param httpSecurity
     */
    @Override
    @SneakyThrows
    public void configure(HttpSecurity httpSecurity) {
        ExpressionUrlAuthorizationConfigurer<HttpSecurity>.ExpressionInterceptUrlRegistry registry =
                httpSecurityDealer.martinExpressionInterceptUrlRegistry(httpSecurity,permitAllUrlProperties.getIgnoreUrls());

        //有动态权限配置时添加动态权限校验过滤器
        registry.and().addFilterAfter(dynamicSecurityFilter(), FilterSecurityInterceptor.class);
        // 任何请求需要身份认证
        registry.and()
                .authorizeRequests()
                .anyRequest()
                .authenticated()
                // 关闭跨站请求防护及不使用session
                .and()
                .csrf()
                .disable()
                .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                // 自定义权限拒绝处理类
                .and()
                .exceptionHandling()
                .accessDeniedHandler(restfulAccessDeniedHandler())
                .authenticationEntryPoint(restAuthenticationEntryPoint());
    }



    @Bean
    public RestfulAccessDeniedHandler restfulAccessDeniedHandler() {
        return new RestfulAccessDeniedHandler();
    }

    @Bean
    public RestAuthenticationEntryPoint restAuthenticationEntryPoint() {
        return new RestAuthenticationEntryPoint();
    }

    @Bean
    public DynamicAccessDecisionManager dynamicAccessDecisionManager() {
        return new DynamicAccessDecisionManager();
    }

    @Bean
    public DynamicSecurityFilter dynamicSecurityFilter() {
        return new DynamicSecurityFilter();
    }

    @Bean
    public DynamicSecurityMetadataSource dynamicSecurityMetadataSource() {
        return new DynamicSecurityMetadataSource();
    }

    /**
     * 单体化后：资源服务器与授权服务器同进程，直接复用本地 RedisTokenStore 校验 token，
     * 不再通过 HTTP 调用 /oauth/check_token（原 RemoteTokenServices）。
     *
     * @return 本地 token 校验服务
     */
    @Bean
    public DefaultTokenServices localTokenServices() {
        DefaultTokenServices tokenServices = new DefaultTokenServices();
        tokenServices.setTokenStore(tokenStore);
        return tokenServices;
    }

    /**
     * token 中用户信息的转换器，保留原有 MartinUserAuthenticationConverter，
     * 保证从 token 解析出的用户属性（userId/tenantId 等）与签发时一致。
     *
     * @return AccessTokenConverter
     */
    @Bean
    public DefaultAccessTokenConverter accessTokenConverter() {
        DefaultAccessTokenConverter accessTokenConverter = new DefaultAccessTokenConverter();
        UserAuthenticationConverter userTokenConverter = new MartinUserAuthenticationConverter();
        accessTokenConverter.setUserTokenConverter(userTokenConverter);
        return accessTokenConverter;
    }

    /**
     * 资源服务器改为本地 tokenStore 校验（同进程 Redis），不再走远程 HTTP 校验。
     *
     * @param resources
     */
    @Override
    public void configure(ResourceServerSecurityConfigurer resources) {
        resources.tokenServices(localTokenServices());
        resources.authenticationEntryPoint(resourceAuthExceptionEntryPoint);
    }

    @Bean
    public PasswordEncoder encode() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    @Primary
    public RestTemplate restTemplate() {
        Map<String, ClientHttpRequestInterceptor> beansOfType = applicationContext.getBeansOfType(ClientHttpRequestInterceptor.class);
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setInterceptors(new ArrayList<>(beansOfType.values()));
        restTemplate.setErrorHandler(new RestResponseErrorHandler());
        return restTemplate;
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = applicationContext;
    }
}
