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
    List<String> scopes;
    String clientSecretHint;
    LocalDateTime createTime;
    /** 明文仅此一次；库中无存 */
    String clientSecret;
}
