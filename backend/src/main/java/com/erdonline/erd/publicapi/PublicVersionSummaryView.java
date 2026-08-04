package com.erdonline.erd.publicapi;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class PublicVersionSummaryView {
    String id;
    String projectId;
    String dbKey;
    String version;
    String versionDate;
    String versionDesc;
    String tag;
    Boolean baseVersion;
    String creator;
    LocalDateTime createTime;
}
