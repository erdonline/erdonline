package com.erdonline.common.social;

import com.erdonline.common.security.config.HttpSecurityDealer;
import com.erdonline.common.security.properties.PermitAllUrlProperties;
import com.erdonline.common.social.oauth2.Oauth2AuthenticationFailureHandler;
import com.erdonline.common.social.oauth2.Oauth2AuthenticationSuccessHandler;
import com.erdonline.common.social.oauth2.SocialAccessDeniedHandler;
import com.erdonline.common.social.oauth2.SocialAuthenticationEntryPoint;
import com.erdonline.common.social.oauth2.convert.SocialOAuth2AccessTokenResponseConverter;
import com.erdonline.common.social.oauth2.token.SocialAuthorizationCodeTokenResponseClient;
import com.erdonline.common.social.oauth2.token.SocialOAuth2AuthorizationCodeGrantRequestEntityConverter;
import com.erdonline.common.social.oauth2.authentication.SocialOAuth2AuthorizationRequestResolver;
import com.erdonline.common.social.oauth2.authentication.SocialOAuth2ClientPropertiesRegistrationAdapter;
import com.erdonline.common.social.oauth2.convert.QqOAuth2AccessTokenResponseHttpMessageConverter;
import com.erdonline.common.social.oauth2.convert.WechatOAuth2AccessTokenResponseHttpMessageConverter;
import com.erdonline.common.social.properties.SocialOAuth2ClientProperties;
import com.erdonline.common.social.service.SocialOauth2UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.http.converter.FormHttpMessageConverter;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.annotation.web.configurers.ExpressionUrlAuthorizationConfigurer;
import org.springframework.security.oauth2.client.endpoint.DefaultAuthorizationCodeTokenResponseClient;
import org.springframework.security.oauth2.client.endpoint.OAuth2AccessTokenResponseClient;
import org.springframework.security.oauth2.client.endpoint.OAuth2AuthorizationCodeGrantRequest;
import org.springframework.security.oauth2.client.http.OAuth2ErrorResponseErrorHandler;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.http.converter.OAuth2AccessTokenResponseHttpMessageConverter;
import org.springframework.security.web.context.SecurityContextPersistenceFilter;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/7/31
 * @describtion MartinLoginAutoConfiguration
 * @since 1.0
 */
@Slf4j
@Order(90)
@Configuration
@EnableWebSecurity
@ConditionalOnProperty(
        prefix = "martin.social",
        name = {"enabled"},
        havingValue = "true",
        matchIfMissing = true
)
@ConditionalOnWebApplication
@EnableConfigurationProperties({PermitAllUrlProperties.class, SocialOAuth2ClientProperties.class})
@ComponentScan(basePackages = {"com.erdonline.common.social", "com.erdonline.common.security", "com.erdonline.common.core"})
public class MartinSocialLoginAutoConfiguration extends WebSecurityConfigurerAdapter {

    @Autowired
    private SocialOAuth2ClientProperties socialOAuth2ClientProperties;

    @Autowired
    private Oauth2AuthenticationSuccessHandler oauth2AuthenticationSuccessHandler;

    @Autowired
    private HttpSecurityDealer httpSecurityDealer;

    InMemoryClientRegistrationRepository socialClientRegistrationRepository() {
        List<ClientRegistration> registrations = new ArrayList<>(
                SocialOAuth2ClientPropertiesRegistrationAdapter.getClientRegistrations(socialOAuth2ClientProperties).values());
        return new InMemoryClientRegistrationRepository(registrations);
    }

    @Override
    protected void configure(HttpSecurity httpSecurity) throws Exception {
        ExpressionUrlAuthorizationConfigurer<HttpSecurity>.ExpressionInterceptUrlRegistry registry =
                httpSecurityDealer.martinExpressionInterceptUrlRegistry(httpSecurity, socialOAuth2ClientProperties.getIgnoreUrls());

        registry.anyRequest().authenticated().and()
                // 通过httpSession保存认证信息
                .addFilter(new SecurityContextPersistenceFilter())

                // 配置OAuth2登录认证
                .oauth2Login(oauth2LoginConfigurer -> oauth2LoginConfigurer
                                // 认证成功后的处理器
                                .successHandler(oauth2AuthenticationSuccessHandler)
                                // 认证失败后的处理器
                                .failureHandler(new Oauth2AuthenticationFailureHandler())
                                // 登录请求url
                                .loginProcessingUrl("/oauth2/callback/*")
//                        // 配置授权服务器端点信息
//                        .authorizationEndpoint(authorizationEndpointConfig -> authorizationEndpointConfig
//                                // 授权端点的前缀基础url
//                                .baseUri("/api/oauth2/authorization"))
                                // 配置获取access_token的端点信息
                                .tokenEndpoint(tokenEndpointConfig ->
                                        tokenEndpointConfig.accessTokenResponseClient(oAuth2AccessTokenResponseClient()))
                                // 配置获取userInfo的端点信息
                                .userInfoEndpoint(userInfoEndpointConfig -> userInfoEndpointConfig.userService(new SocialOauth2UserService()))
                                .authorizationEndpoint(authorizationEndpointConfig -> authorizationEndpointConfig
                                        .authorizationRequestResolver(new SocialOAuth2AuthorizationRequestResolver(socialClientRegistrationRepository())))
                )

                // 配置匿名用户过滤器
                .anonymous()
                .and()
                // 配置认证端点和未授权的请求处理器
                .exceptionHandling(exceptionHandlingConfigurer -> exceptionHandlingConfigurer
                        .authenticationEntryPoint(new SocialAuthenticationEntryPoint())
                        .accessDeniedHandler(new SocialAccessDeniedHandler()))
                .csrf().disable();

    }

    /**
     * qq获取access_token返回的结果是类似get请求参数的字符串，无法通过指定Accept请求头来使qq返回特定的响应类型，并且qq返回的access_token
     * 也缺少了必须的token_type字段（不符合oauth2标准的授权码认证流程），spring-security默认远程获取
     * access_token的客户端是{@link DefaultAuthorizationCodeTokenResponseClient}，所以我们需要
     * 自定义{@link QqOAuth2AccessTokenResponseHttpMessageConverter}注入到这个client中来解析qq的access_token响应信息
     *
     * @return {@link DefaultAuthorizationCodeTokenResponseClient} 用来获取access_token的客户端
     * @see <a href="https://www.oauth.com/oauth2-servers/access-tokens/authorization-code-request">authorization-code-request规范</a>
     * @see <a href="https://www.oauth.com/oauth2-servers/access-tokens/access-token-response">access-token-response规范</a>
     * @see <a href="https://wiki.connect.qq.com/%E5%BC%80%E5%8F%91%E6%94%BB%E7%95%A5_server-side">qq开发文档</a>
     */
    private OAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> oAuth2AccessTokenResponseClient() {
        SocialAuthorizationCodeTokenResponseClient client = new SocialAuthorizationCodeTokenResponseClient();
        OAuth2AccessTokenResponseHttpMessageConverter oAuth2AccessTokenResponseHttpMessageConverter = new OAuth2AccessTokenResponseHttpMessageConverter();
        //自定义结果解析，将所有返回信息放入 additionalParameters
        oAuth2AccessTokenResponseHttpMessageConverter.setTokenResponseConverter(new SocialOAuth2AccessTokenResponseConverter());
        RestTemplate restTemplate = new RestTemplate(Arrays.asList(
                new FormHttpMessageConverter(),
                // 解析标准的AccessToken响应信息转换器
                oAuth2AccessTokenResponseHttpMessageConverter,
                // 解析 TEXT_HTML 的AccessToken响应信息转换器
                new QqOAuth2AccessTokenResponseHttpMessageConverter(MediaType.TEXT_HTML),
                // 解析 TEXT_PLAIN 的AccessToken响应信息转换器
                new WechatOAuth2AccessTokenResponseHttpMessageConverter(MediaType.TEXT_PLAIN)

        ));
        SocialOAuth2AuthorizationCodeGrantRequestEntityConverter entityConverter = new SocialOAuth2AuthorizationCodeGrantRequestEntityConverter();
        client.setRequestEntityConverter(entityConverter);
        restTemplate.setErrorHandler(new OAuth2ErrorResponseErrorHandler());
        client.setRestOperations(restTemplate);
        return client;
    }


}
