package com.erdonline.system.dto;

import lombok.Data;

import javax.validation.constraints.NotEmpty;

/**
 * @author: 零代科技
 * @version: 1.0
 * @date: 2023/5/3 20:49
 * @describtion: UserDto
 */
@Data
public class UserDto {
    private String pwd;
    private String email;
    private String phone;
}