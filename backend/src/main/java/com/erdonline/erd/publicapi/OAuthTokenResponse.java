package com.erdonline.erd.publicapi;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class OAuthTokenResponse {
    String accessToken;
    String tokenType;
    long expiresIn;
    String scope;
    List<String> scopes;
    /** 仅 authorization_code / refresh_token 换票；client_credentials 为 null */
    String refreshToken;
    /** refresh_token 剩余 TTL（秒）；无 refresh 时为 null */
    Long refreshExpiresIn;
    /** 仅当授予 openid（authorization_code / refresh_token）；client_credentials 为 null */
    String idToken;
}
