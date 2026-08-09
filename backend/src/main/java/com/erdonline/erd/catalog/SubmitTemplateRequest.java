package com.erdonline.erd.catalog;

import lombok.Data;

@Data
public class SubmitTemplateRequest {
    private String projectId;
    private String title;
    private String description;
    private String tags;
}
