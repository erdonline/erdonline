package com.erdonline.erd.publicapi;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

/**
 * PAT 公开 API：整份替换 projectJSON（写入前清空 profile.dbs）。
 * {@code projectJSON} / {@code projectJson} / {@code snapshot} 三选一。
 */
@Data
public class PutPublicProjectJsonRequest {

    @NotNull
    @JsonAlias({"projectJson", "snapshot"})
    private Map<String, Object> projectJSON;

    @JsonIgnore
    public Map<String, Object> resolveProjectJson() {
        return projectJSON;
    }
}
