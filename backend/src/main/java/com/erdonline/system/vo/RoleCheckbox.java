package com.erdonline.system.vo;

import lombok.Data;

import java.io.Serializable;

/**
 * @author 狮少
 * @version 1.0
 * @date 2020/8/26
 * @describtion RoleCheckbox
 * @since 1.0
 */
@Data
public class RoleCheckbox implements Serializable {
    private static final long serialVersionUID = 7698715642245452176L;
    private String label;
    private Integer value;
    private boolean checked;
}
