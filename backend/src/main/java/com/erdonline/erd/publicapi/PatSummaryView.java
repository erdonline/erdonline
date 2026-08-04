package com.erdonline.erd.publicapi;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.List;

@Value
@Builder
public class PatSummaryView {
    String id;
    String name;
    List<String> scopes;
    String tokenHint;
    LocalDateTime expireTime;
    LocalDateTime lastUsedTime;
    LocalDateTime createTime;
    boolean revoked;
}
