package com.erdonline.erd.publicapi;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class PublicProjectSummaryView {
    String id;
    String projectName;
    String description;
    String type;
    String tags;
    LocalDateTime updateTime;
}
