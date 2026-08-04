package com.erdonline.erd.publicapi;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.List;

@Value
@Builder
public class OAuthClientCreatedView {
    String id;
    String clientId;
    String name;
    String clientType;
    List<String> scopes;
    List<String> redirectUris;
    String clientSecretHint;
    LocalDateTime createTime;
    /** 明文仅此一次；public 客户端为 null */
    String clientSecret;
}
