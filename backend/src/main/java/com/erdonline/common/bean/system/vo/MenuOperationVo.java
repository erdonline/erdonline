package com.erdonline.common.bean.system.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * @author 狮少
 * @version 1.0
 * @date 2020/9/7
 * @describtion MenuOperationVo
 * @since 1.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "菜单按钮对象")
public class MenuOperationVo implements Serializable {
    private static final long serialVersionUID = 5445335543205026223L;

    @ApiModelProperty(value = "菜单Id")
    private String menuId;

    @ApiModelProperty(value = "菜单名称")
    private String menuName;

    @ApiModelProperty(value = "按钮名称")
    private String name;

    @ApiModelProperty(value = "按钮value")
    private String value;

    @ApiModelProperty(value = "权限code")
    private String code;
}
