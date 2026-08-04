package com.erdonline.erd.publicapi;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CreateOAuthClientRequest {

    @NotBlank
    @Size(max = 64)
    private String name;

    /** 省略则默认 projects:read,versions:read（与 PAT 一致） */
    private List<String> scopes;

    /**
     * {@code confidential}（默认，可 client_credentials）或 {@code public}（无 secret，须 PKCE + redirect）。
     */
    @Size(max = 16)
    private String clientType;

    /**
     * Authorization Code 精确匹配用；public 必填至少一条；confidential M2M-only 可省略。
     */
    private List<@NotBlank @Size(max = 512) String> redirectUris;
}
