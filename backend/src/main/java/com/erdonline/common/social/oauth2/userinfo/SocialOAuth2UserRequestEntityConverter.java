package com.erdonline.common.social.oauth2.userinfo;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.convert.Convert;
import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.AuthenticationMethod;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/8/4
 * @describtion 适配获取userInfo的接口
 * @since 1.0
 */
@Slf4j
public class SocialOAuth2UserRequestEntityConverter implements Converter<OAuth2UserRequest, RequestEntity<?>> {
    private static final MediaType DEFAULT_CONTENT_TYPE = MediaType.valueOf("application/x-www-form-urlencoded;charset=UTF-8");

    public SocialOAuth2UserRequestEntityConverter() {
    }

    @Override
    public RequestEntity<?> convert(OAuth2UserRequest userRequest) {
        ClientRegistration clientRegistration = userRequest.getClientRegistration();
        HttpMethod httpMethod = HttpMethod.GET;
        if (AuthenticationMethod.FORM.equals(clientRegistration.getProviderDetails().getUserInfoEndpoint().getAuthenticationMethod())) {
            httpMethod = HttpMethod.POST;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        String userInfoUri = clientRegistration.getProviderDetails().getUserInfoEndpoint().getUri();
        if (StrUtil.isNotBlank(userInfoUri)) {
            Map<String, String> uriVariables = new HashMap(64);
            BeanUtil.copyProperties(userRequest.getAccessToken(), uriVariables);
            BeanUtil.copyProperties(userRequest.getClientRegistration(), uriVariables);
            BeanUtil.copyProperties(userRequest.getAdditionalParameters(), uriVariables);
            log.debug("uriVariables: {}", Convert.toStr(uriVariables));
            userInfoUri = UriComponentsBuilder.fromUriString(userInfoUri)
                    .buildAndExpand(uriVariables).toUriString();
            log.info("userInfoUri: {}", userInfoUri);
        }
        URI uri = UriComponentsBuilder.fromUriString(userInfoUri).build().toUri();
        RequestEntity request;
        if (HttpMethod.POST.equals(httpMethod)) {
            headers.setContentType(DEFAULT_CONTENT_TYPE);
            MultiValueMap<String, String> formParameters = new LinkedMultiValueMap();
            formParameters.add("access_token", userRequest.getAccessToken().getTokenValue());
            request = new RequestEntity(formParameters, headers, httpMethod, uri);
        } else {
            headers.setBearerAuth(userRequest.getAccessToken().getTokenValue());
            request = new RequestEntity(headers, httpMethod, uri);
        }

        return request;
    }
}

