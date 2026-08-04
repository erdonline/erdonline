package com.erdonline.erd.publicapi;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.Map;

@Value
@Builder
public class PublicProjectDetailView {
    String id;
    String projectName;
    String description;
    String type;
    String tags;
    LocalDateTime updateTime;
    /** Sanitized projectJSON (profile.dbs cleared; ADR-0008). */
    Map<String, Object> projectJson;
}
