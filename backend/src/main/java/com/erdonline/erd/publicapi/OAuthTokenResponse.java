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
}
