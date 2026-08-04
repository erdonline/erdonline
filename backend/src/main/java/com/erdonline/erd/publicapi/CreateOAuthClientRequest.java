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
}
