package com.erdonline.common.api.dto;

import lombok.Data;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;

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
