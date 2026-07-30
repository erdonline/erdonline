package com.erdonline.common.bean.system.vo;

import lombok.Data;

import java.io.Serializable;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/3/22
 * @describtion PrivilegeVO
 * @since 1.0
 */
@Data
public class PrivilegeVO implements Serializable {

    private static final long serialVersionUID = 4679550570620682504L;

    private String url;
    private String authority;
    private String method;
}
