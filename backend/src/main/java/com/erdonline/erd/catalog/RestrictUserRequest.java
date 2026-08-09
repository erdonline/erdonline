package com.erdonline.erd.catalog;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RestrictUserRequest {

    @NotBlank
    private String userId;
}
