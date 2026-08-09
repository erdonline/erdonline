package com.erdonline.erd.catalog;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class CatalogTemplateDetailView {
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
    private Map<String, Object> projectJSON;
    private Map<String, Object> configJSON;
    private Integer userRating;
    private boolean installed;
    private boolean commentsEnabled;
    private boolean canManageComments;
    private boolean official;
    private LocalDateTime createTime;
}
