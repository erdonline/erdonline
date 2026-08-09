package com.erdonline.erd.catalog;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CatalogSubmissionView {
    private String id;
    private String projectId;
    private String title;
    private String description;
    private List<String> tags;
    private String status;
    private String reviewNote;
    private String templateId;
    private LocalDateTime createTime;
}
