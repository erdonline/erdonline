package com.erdonline.common.api.dto;

import lombok.Data;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * @author: liangcan
 * @version: 1.0
 * @date: 2022/10/23 11:58
 * @describtion: RoleUserDto
 */
@Data
public class RoleUserDto {
    @NotEmpty(message = "projectId 为空")
    private String projectId;
    @NotEmpty(message = "roleId 为空")
    private String roleId;
    @NotEmpty(message = "userIds 为空")
    private List<String> userIds;
}
