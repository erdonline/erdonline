package com.erdonline.erd.publicapi;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * PAT 公开 API：提交新版本（写入 {@code db_change}）。
 * {@code projectJSON} / {@code projectJson} / {@code snapshot} 三选一，内容为模型快照。
 */
@Data
public class CreatePublicVersionRequest {

    @NotBlank
    @Size(max = 64)
    private String dbKey;

    @NotBlank
    @Size(max = 20)
    private String version;

    @NotBlank
    @Size(max = 500)
    private String versionDesc;

    @Size(max = 255)
    private String tag;

    /** 可选；空则服务端填当前时间（与设计器格式对齐） */
    @Size(max = 64)
    private String versionDate;

    private Boolean baseVersion;

    private List<Object> changes;

    @JsonAlias({"projectJson", "snapshot"})
    private Map<String, Object> projectJSON;

    @JsonIgnore
    public Map<String, Object> resolveProjectJson() {
        return projectJSON;
    }
}
