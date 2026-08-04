package com.erdonline.erd.publicapi;

import lombok.Builder;
import lombok.Value;

import java.util.List;

/**
 * OAuth authorize 同意页预览（GET /oauth/authorize 成功响应；不签发 code）。
 */
@Value
@Builder
public class OAuthConsentView {
    String clientId;
    String clientName;
    String clientType;
    List<String> scopes;
    /** 注册表精确串（须原样回传 POST） */
    String redirectUri;
    /** 展示用 host[:port] */
    String redirectHost;
}
