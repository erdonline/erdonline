package com.erdonline.erd.publicapi;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.List;

@Value
@Builder
public class OAuthClientSummaryView {
    String id;
    String clientId;
    String name;
    List<String> scopes;
    String clientSecretHint;
    LocalDateTime createTime;
    boolean revoked;
}
