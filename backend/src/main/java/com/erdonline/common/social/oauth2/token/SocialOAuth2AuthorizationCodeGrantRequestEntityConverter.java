package com.erdonline.common.social.oauth2.token;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.exception.StatefulException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.security.oauth2.client.endpoint.OAuth2AuthorizationCodeGrantRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationExchange;
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
 * @describtion 适配获取 token 的接口
 * @since 1.0
 */
@Slf4j
public class SocialOAuth2AuthorizationCodeGrantRequestEntityConverter implements Converter<OAuth2AuthorizationCodeGrantRequest, RequestEntity<?>> {
    private static HttpHeaders DEFAULT_TOKEN_REQUEST_HEADERS = getDefaultTokenRequestHeaders();

    public SocialOAuth2AuthorizationCodeGrantRequestEntityConverter() {
    }

    @Override
    public RequestEntity<?> convert(OAuth2AuthorizationCodeGrantRequest authorizationCodeGrantRequest) {
        ClientRegistration clientRegistration = authorizationCodeGrantRequest.getClientRegistration();
        HttpHeaders headers = getTokenRequestHeaders(clientRegistration);
        MultiValueMap<String, String> formParameters = this.buildFormParameters(authorizationCodeGrantRequest);
        Map<String, String> uriVariables = new HashMap(64);
        BeanUtil.copyProperties(clientRegistration, uriVariables);
        BeanUtil.copyProperties(authorizationCodeGrantRequest.getAuthorizationExchange().getAuthorizationResponse(), uriVariables);
        String tokenUri = clientRegistration.getProviderDetails().getTokenUri();
        if (StrUtil.isBlank(tokenUri)) {
            throw new StatefulException(ApiErrorCode.OAUTH_ERROR);
        }
        tokenUri = UriComponentsBuilder.fromUriString(tokenUri).buildAndExpand(uriVariables).toUriString();
        log.info("tokenUri: {}", tokenUri);
        URI uri = UriComponentsBuilder.fromUriString(tokenUri).build().toUri();
        return new RequestEntity(formParameters, headers, HttpMethod.GET, uri);
    }

    private MultiValueMap<String, String> buildFormParameters(OAuth2AuthorizationCodeGrantRequest authorizationCodeGrantRequest) {
        ClientRegistration clientRegistration = authorizationCodeGrantRequest.getClientRegistration();
        OAuth2AuthorizationExchange authorizationExchange = authorizationCodeGrantRequest.getAuthorizationExchange();
        MultiValueMap<String, String> formParameters = new LinkedMultiValueMap();
        formParameters.add("grant_type", authorizationCodeGrantRequest.getGrantType().getValue());
        formParameters.add("code", authorizationExchange.getAuthorizationResponse().getCode());
        String redirectUri = authorizationExchange.getAuthorizationRequest().getRedirectUri();
        String codeVerifier = (String) authorizationExchange.getAuthorizationRequest().getAttribute("code_verifier");
        if (redirectUri != null) {
            formParameters.add("redirect_uri", redirectUri);
        }

        if (!ClientAuthenticationMethod.BASIC.equals(clientRegistration.getClientAuthenticationMethod())) {
            formParameters.add("client_id", clientRegistration.getClientId());
        }

        if (ClientAuthenticationMethod.POST.equals(clientRegistration.getClientAuthenticationMethod())) {
            formParameters.add("client_secret", clientRegistration.getClientSecret());
        }

        if (codeVerifier != null) {
            formParameters.add("code_verifier", codeVerifier);
        }

        return formParameters;
    }

    private static HttpHeaders getTokenRequestHeaders(ClientRegistration clientRegistration) {
        HttpHeaders headers = new HttpHeaders();
        headers.addAll(DEFAULT_TOKEN_REQUEST_HEADERS);
        if (ClientAuthenticationMethod.BASIC.equals(clientRegistration.getClientAuthenticationMethod())) {
            headers.setBasicAuth(clientRegistration.getClientId(), clientRegistration.getClientSecret());
        }

        return headers;
    }

    private static HttpHeaders getDefaultTokenRequestHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON_UTF8));
        MediaType contentType = MediaType.valueOf("application/x-www-form-urlencoded;charset=UTF-8");
        headers.setContentType(contentType);
        return headers;
    }
}

