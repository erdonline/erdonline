package com.erdonline.common.social.service;


import com.erdonline.common.api.system.RemoteSystemUser;
import com.erdonline.common.core.support.SpringContextHelper;
import com.erdonline.common.social.oauth2.userinfo.SocialOAuth2UserRequestEntityConverter;
import com.erdonline.common.social.oauth2.userinfo.WechatMappingJackson2HttpMessageConverter;
import com.erdonline.common.social.resource.SocialPrincipalExtractor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.convert.converter.Converter;

import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.http.OAuth2ErrorResponseErrorHandler;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthorizationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2UserAuthority;
import org.springframework.stereotype.Component;
import org.springframework.util.Assert;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestOperations;
import org.springframework.web.client.RestTemplate;

import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/8/3
 * @describtion SocialOauth2UserService
 * @since 1.0
 */
@Slf4j
public class SocialOauth2UserService extends DefaultOAuth2UserService {

    private static final String MISSING_USER_INFO_URI_ERROR_CODE = "missing_user_info_uri";
    private static final String MISSING_USER_NAME_ATTRIBUTE_ERROR_CODE = "missing_user_name_attribute";
    private static final String INVALID_USER_INFO_RESPONSE_ERROR_CODE = "invalid_user_info_response";
    private static final ParameterizedTypeReference<Map<String, Object>> PARAMETERIZED_RESPONSE_TYPE = new ParameterizedTypeReference<Map<String, Object>>() {
    };
    private Converter<OAuth2UserRequest, RequestEntity<?>> requestEntityConverter = new SocialOAuth2UserRequestEntityConverter();
    private RestOperations restOperations;

    public SocialOauth2UserService() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.getMessageConverters().add(new WechatMappingJackson2HttpMessageConverter());
        restTemplate.setErrorHandler(new OAuth2ErrorResponseErrorHandler());
        this.restOperations = restTemplate;
    }

    @SneakyThrows
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        Assert.notNull(userRequest, "userRequest cannot be null");
        String userInfoUri = userRequest.getClientRegistration().getProviderDetails().getUserInfoEndpoint().getUri();
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        if (!StringUtils.hasText(userInfoUri)) {
            OAuth2Error oauth2Error = new OAuth2Error("missing_user_info_uri", "Missing required UserInfo Uri in UserInfoEndpoint for Client Registration: " + registrationId, (String) null);
            throw new OAuth2AuthenticationException(oauth2Error, oauth2Error.toString());
        } else {
            String userNameAttributeName = userRequest.getClientRegistration().getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();
            if (!StringUtils.hasText(userNameAttributeName)) {
                OAuth2Error oauth2Error = new OAuth2Error("missing_user_name_attribute", "Missing required \"user name\" attribute name in UserInfoEndpoint for Client Registration: " + registrationId, (String) null);
                throw new OAuth2AuthenticationException(oauth2Error, oauth2Error.toString());
            } else {

                RequestEntity request = (RequestEntity) this.requestEntityConverter.convert(userRequest);


                ResponseEntity response;
                OAuth2Error oauth2Error;
                try {
                    response = this.restOperations.exchange(request, PARAMETERIZED_RESPONSE_TYPE);
                } catch (OAuth2AuthorizationException var10) {
                    oauth2Error = var10.getError();
                    StringBuilder errorDetails = new StringBuilder();
                    errorDetails.append("Error details: [");
                    errorDetails.append("UserInfo Uri: ").append(userInfoUri);
                    errorDetails.append(", Error Code: ").append(oauth2Error.getErrorCode());
                    if (oauth2Error.getDescription() != null) {
                        errorDetails.append(", Error Description: ").append(oauth2Error.getDescription());
                    }

                    errorDetails.append("]");
                    oauth2Error = new OAuth2Error("invalid_user_info_response", "An error occurred while attempting to retrieve the UserInfo Resource: " + errorDetails.toString(), (String) null);
                    throw new OAuth2AuthenticationException(oauth2Error, oauth2Error.toString(), var10);
                } catch (RestClientException var11) {
                    oauth2Error = new OAuth2Error("invalid_user_info_response", "An error occurred while attempting to retrieve the UserInfo Resource: " + var11.getMessage(), (String) null);
                    throw new OAuth2AuthenticationException(oauth2Error, oauth2Error.toString(), var11);
                }
                SocialPrincipalExtractor socialPrincipalExtractor = (SocialPrincipalExtractor) SpringContextHelper.getBean("socialPrincipalExtractor");
                Map<String, Object> userAttributes = (Map) response.getBody();
                LinkedHashMap martinTokenInfo = socialPrincipalExtractor.extractPrincipal(registrationId, userAttributes);
                Set<GrantedAuthority> authorities = new LinkedHashSet();
                authorities.add(new OAuth2UserAuthority(userAttributes));
                OAuth2AccessToken token = userRequest.getAccessToken();
                Iterator var8 = token.getScopes().iterator();

                while (var8.hasNext()) {
                    String authority = (String) var8.next();
                    authorities.add(new SimpleGrantedAuthority("SCOPE_" + authority));
                }
                Object userNameAttributeValue = userAttributes.get(userNameAttributeName);
                martinTokenInfo.put(userNameAttributeName, userNameAttributeValue);
                DefaultOAuth2User defaultOAuth2User = new DefaultOAuth2User(authorities, martinTokenInfo, userNameAttributeName);
                log.info("defaultOAuth2User:{}", defaultOAuth2User);
                return defaultOAuth2User;
            }
        }
    }

}
