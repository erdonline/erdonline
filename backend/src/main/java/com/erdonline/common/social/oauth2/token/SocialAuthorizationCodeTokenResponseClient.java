package com.erdonline.common.social.oauth2.token;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.FormHttpMessageConverter;
import org.springframework.security.oauth2.client.endpoint.OAuth2AccessTokenResponseClient;
import org.springframework.security.oauth2.client.endpoint.OAuth2AuthorizationCodeGrantRequest;
import org.springframework.security.oauth2.client.endpoint.OAuth2AuthorizationCodeGrantRequestEntityConverter;
import org.springframework.security.oauth2.client.http.OAuth2ErrorResponseErrorHandler;
import org.springframework.security.oauth2.core.OAuth2AuthorizationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.endpoint.OAuth2AccessTokenResponse;
import org.springframework.security.oauth2.core.http.converter.OAuth2AccessTokenResponseHttpMessageConverter;
import org.springframework.util.Assert;
import org.springframework.util.CollectionUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestOperations;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/8/4
 * @describtion SocialAuthorizationCodeTokenResponseClient
 * @since 1.0
 */
@Slf4j
public class SocialAuthorizationCodeTokenResponseClient implements OAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> {
    private static final String INVALID_TOKEN_RESPONSE_ERROR_CODE = "invalid_token_response";
    private Converter<OAuth2AuthorizationCodeGrantRequest, RequestEntity<?>> requestEntityConverter = new OAuth2AuthorizationCodeGrantRequestEntityConverter();
    private RestOperations restOperations;

    public SocialAuthorizationCodeTokenResponseClient() {
        RestTemplate restTemplate = new RestTemplate(Arrays.asList(new FormHttpMessageConverter(), new OAuth2AccessTokenResponseHttpMessageConverter()));
        restTemplate.setErrorHandler(new OAuth2ErrorResponseErrorHandler());
        this.restOperations = restTemplate;
    }

    @Override
    public OAuth2AccessTokenResponse getTokenResponse(OAuth2AuthorizationCodeGrantRequest authorizationCodeGrantRequest) {
        Assert.notNull(authorizationCodeGrantRequest, "authorizationCodeGrantRequest cannot be null");
        RequestEntity request = (RequestEntity)this.requestEntityConverter.convert(authorizationCodeGrantRequest);

        ResponseEntity response;
        try {
            response = this.restOperations.exchange(request, OAuth2AccessTokenResponse.class);
        } catch (RestClientException var6) {
            OAuth2Error oauth2Error = new OAuth2Error("invalid_token_response", "An error occurred while attempting to retrieve the OAuth 2.0 Access Token Response: " + var6.getMessage(), (String) null);
            log.error("", var6);
            throw new OAuth2AuthorizationException(oauth2Error, var6);
        }

        OAuth2AccessTokenResponse tokenResponse = (OAuth2AccessTokenResponse)response.getBody();
        if (CollectionUtils.isEmpty(tokenResponse.getAccessToken().getScopes())) {
            tokenResponse = OAuth2AccessTokenResponse.withResponse(tokenResponse).scopes(authorizationCodeGrantRequest.getClientRegistration().getScopes()).build();
        }

        return tokenResponse;
    }

    public void setRequestEntityConverter(Converter<OAuth2AuthorizationCodeGrantRequest, RequestEntity<?>> requestEntityConverter) {
        Assert.notNull(requestEntityConverter, "requestEntityConverter cannot be null");
        this.requestEntityConverter = requestEntityConverter;
    }

    public void setRestOperations(RestOperations restOperations) {
        Assert.notNull(restOperations, "restOperations cannot be null");
        this.restOperations = restOperations;
    }
}
