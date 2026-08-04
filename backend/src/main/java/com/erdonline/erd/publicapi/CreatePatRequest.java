package com.erdonline.erd.publicapi;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CreatePatRequest {

    @NotBlank
    @Size(max = 64)
    private String name;

    /** 省略则默认 projects:read,versions:read */
    private List<String> scopes;

    /** null = 不过期；最大 3650 天 */
    @Min(1)
    @Max(3650)
    private Integer expiresInDays;
}
