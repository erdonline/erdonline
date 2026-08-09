package com.erdonline.erd.catalog;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CatalogTemplateSummaryView {
    private String id;
    private String slug;
    private String title;
    private String description;
    private List<String> tags;
    private String authorHandle;
    private String authorDisplayName;
    private int installCount;
    private double ratingAverage;
    private int ratingCount;
    private LocalDateTime createTime;
}
