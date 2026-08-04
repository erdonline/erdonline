package com.erdonline.erd.publicapi;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Value
@Builder
public class PublicVersionDetailView {
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
    List<Object> changes;
    /** Sanitized projectJSON (profile.dbs cleared; ADR-0008). */
    Map<String, Object> projectJson;
}
