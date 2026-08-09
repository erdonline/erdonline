package com.erdonline.erd.catalog;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReportCommentRequest {

    @Size(max = 500)
    private String reason;
}
