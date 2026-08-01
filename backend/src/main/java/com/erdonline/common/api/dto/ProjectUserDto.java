package com.erdonline.common.api.dto;

import lombok.Data;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

/**
 * @author: liangcan
 * @version: 1.0
 * @date: 2022/10/23 11:58
 * @describtion: ProjectUserDto
 */
@Data
public class ProjectUserDto {
    private String projectId;
    private String roleId;
    private String username;
    private String email;
    @NotNull(message = "分页参数 current 为空")
    private Integer current;
    @NotNull(message = "分页参数 pageSize 为空")
    private Integer pageSize;
}
