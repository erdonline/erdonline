package com.erdonline.common.api.dto;

import lombok.Data;

import javax.validation.constraints.NotEmpty;

/**
 * @author: liangcan
 * @version: 1.0
 * @date: 2022/10/29 14:23
 * @describtion: UserDto
 */
@Data
public class UserDto {
    @NotEmpty(message = "username 为空")
    private String username;
    @NotEmpty(message = "pwd 为空")
    private String pwd;
    @NotEmpty(message = "email 为空")
    private String email;
    @NotEmpty(message = "phone 为空")
    private String phone;
}
