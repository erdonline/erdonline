package com.erdonline.erd.catalog;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ToggleCommentsRequest {

    @NotNull
    private Boolean enabled;
}
