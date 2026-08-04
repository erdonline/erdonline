package com.erdonline.erd.publicapi;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * PAT 公开 API：部分更新项目元数据（须至少一项非空）。
 */
@Data
public class PatchPublicProjectRequest {

    @Size(max = 100)
    @JsonAlias("name")
    private String projectName;

    @Size(max = 500)
    private String description;

    @Size(max = 255)
    private String tags;
}
