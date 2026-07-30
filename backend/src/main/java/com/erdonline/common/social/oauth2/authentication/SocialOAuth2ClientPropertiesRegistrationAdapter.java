package com.erdonline.common.social.oauth2.authentication;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import com.erdonline.common.social.properties.SocialOAuth2ClientProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.PropertyMapper;
import org.springframework.boot.convert.ApplicationConversionService;
import org.springframework.core.convert.ConversionException;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrations;
import org.springframework.security.oauth2.core.AuthenticationMethod;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.HashMap;
import java.util.Map;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/8/4
 * @describtion SocialOAuth2ClientPropertiesRegistrationAdapter, 适配解析OAuth2ClientProperties中的配置
 * @since 1.0
 */
@Slf4j
public final class SocialOAuth2ClientPropertiesRegistrationAdapter {
    private SocialOAuth2ClientPropertiesRegistrationAdapter() {
    }

    public static Map<String, ClientRegistration> getClientRegistrations(SocialOAuth2ClientProperties properties) {
        Map<String, ClientRegistration> clientRegistrations = new HashMap<>();
        properties.getRegistration().forEach((key, value) -> clientRegistrations.put(key,
                getClientRegistration(key, value, properties.getProvider())));
        return clientRegistrations;
    }

    private static ClientRegistration getClientRegistration(String registrationId,
                                                            SocialOAuth2ClientProperties.Registration registration,
                                                            Map<String, SocialOAuth2ClientProperties.Provider> providers) {
        ClientRegistration.Builder builder = getBuilderFromIssuerIfPossible(registrationId, registration, providers);
        if (builder == null) {
            builder = getBuilder(registrationId, registration, providers);
        }
        PropertyMapper map = PropertyMapper.get().alwaysApplyingWhenNonNull();
        map.from(registration::getClientId).to(builder::clientId);
        map.from(registration::getClientSecret).to(builder::clientSecret);
        map.from(registration::getClientAuthenticationMethod).as(ClientAuthenticationMethod::new)
                .to(builder::clientAuthenticationMethod);
        map.from(registration::getAuthorizationGrantType).as(AuthorizationGrantType::new)
                .to(builder::authorizationGrantType);
        map.from(registration::getRedirectUri).to(builder::redirectUriTemplate);
        map.from(registration::getScope).as(StringUtils::toStringArray).to(builder::scope);
        map.from(registration::getClientName).to(builder::clientName);
        return builder.build();
    }

    private static ClientRegistration.Builder getBuilderFromIssuerIfPossible(String registrationId,
                                                                             SocialOAuth2ClientProperties.Registration registration,
                                                                             Map<String, SocialOAuth2ClientProperties.Provider> providers) {
        String providerId = (registration.getProvider() != null) ? registration.getProvider() : registrationId;
        if (providers.containsKey(providerId)) {
            SocialOAuth2ClientProperties.Provider provider = providers.get(providerId);
            String issuer = provider.getIssuerUri();
            if (issuer != null) {
                ClientRegistration.Builder builder = ClientRegistrations.fromIssuerLocation(issuer)
                        .registrationId(registrationId);
                return getBuilder(builder, provider, registration);
            }
        }
        return null;
    }

    private static ClientRegistration.Builder getBuilder(String registrationId, SocialOAuth2ClientProperties.Registration registration,
                                                         Map<String, SocialOAuth2ClientProperties.Provider> providers) {
        String providerId = (registration.getProvider() != null) ? registration.getProvider() : registrationId;
        CommonOAuth2Provider provider = getCommonProvider(providerId);
        if (provider == null && !providers.containsKey(providerId)) {
            throw new IllegalStateException(getErrorMessage(registration.getProvider(), registrationId));
        }
        ClientRegistration.Builder builder = (provider != null) ? provider.getBuilder(registrationId)
                : ClientRegistration.withRegistrationId(registrationId);
        if (providers.containsKey(providerId)) {
            return getBuilder(builder, providers.get(providerId), registration);
        }
        return builder;
    }

    private static String getErrorMessage(String configuredProviderId, String registrationId) {
        return ((configuredProviderId != null) ? "Unknown provider ID '" + configuredProviderId + "'"
                : "Provider ID must be specified for client registration '" + registrationId + "'");
    }

    private static ClientRegistration.Builder getBuilder(ClientRegistration.Builder builder,
                                                         SocialOAuth2ClientProperties.Provider provider,
                                                         SocialOAuth2ClientProperties.Registration registration) {
        PropertyMapper map = PropertyMapper.get().alwaysApplyingWhenNonNull();
        Map<String, String> uriVariables = new HashMap(32);
        BeanUtil.copyProperties(registration, uriVariables);
        if (StrUtil.isNotBlank(provider.getAuthorizationUri())) {
            String authorizationUri = UriComponentsBuilder.fromUriString(provider.getAuthorizationUri())
                    .buildAndExpand(uriVariables).toUriString();
            provider.setAuthorizationUri(authorizationUri);
            log.info("authorizationUri: {}", authorizationUri);
        }
//        if (StrUtil.isNotBlank(provider.getJwkSetUri())) {
//            String jwkSetUri = UriComponentsBuilder.fromUriString(provider.getJwkSetUri())
//                    .buildAndExpand(uriVariables).toUriString();
//            provider.setJwkSetUri(jwkSetUri);
//            log.info("jwkSetUri: {}", jwkSetUri);
//        }
//        if (StrUtil.isNotBlank(provider.getIssuerUri())) {
//            String issuerUri = UriComponentsBuilder.fromUriString(provider.getIssuerUri())
//                    .buildAndExpand(uriVariables).toUriString();
//            provider.setIssuerUri(issuerUri);
//            log.info("issuerUri: {}", issuerUri);
//        }
        map.from(provider::getAuthorizationUri).to(builder::authorizationUri);
        map.from(provider::getTokenUri).to(builder::tokenUri);
        map.from(provider::getUserInfoUri).to(builder::userInfoUri);
        map.from(provider::getUserInfoAuthenticationMethod).as(AuthenticationMethod::new)
                .to(builder::userInfoAuthenticationMethod);
        map.from(provider::getJwkSetUri).to(builder::jwkSetUri);
        map.from(provider::getUserNameAttribute).to(builder::userNameAttributeName);
        return builder;
    }

    private static CommonOAuth2Provider getCommonProvider(String providerId) {
        try {
            return ApplicationConversionService.getSharedInstance().convert(providerId, CommonOAuth2Provider.class);
        } catch (ConversionException ex) {
            return null;
        }
    }

//    public static void main(String[] args) {
////        SocialOAuth2ClientProperties.Provider provider = new SocialOAuth2ClientProperties.Provider();
////        provider.setTokenUri("https://api.weixin.qq.com/sns/oauth2/access_token?appid={clientId}&secret={clientSecret}&code=CODE&grant_type=authorization_code");
////        Map<String, String> uriVariables = new HashMap();
////        uriVariables.put("clientId", "111");
////        uriVariables.put("clientSecret", "111");
////        String tokenUri = UriComponentsBuilder.fromUriString(provider.getTokenUri())
////                .buildAndExpand(uriVariables).toUriString();
////        provider.setTokenUri(tokenUri);
////        log.info("tokenUri: {}", tokenUri);
//
//        String encode = URLEncoder.encode("http://www.zerocode.net.cn/auth/oauth2/callback/wechat");
//        System.out.println("encode = " + encode);
//
//    }
}
