package com.erdonline.common.bean.system.vo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * @author 狮少
 * @version 1.0
 * @date 2020/9/7
 * @describtion RoleOperationVo
 * @since 1.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "角色的按钮组对象")
public class RoleOperationVo implements Serializable {
    private static final long serialVersionUID = -1695280455487849108L;

    @ApiModelProperty(value = "已分配的按钮集合")
    private List<String > defaultValue;

    @ApiModelProperty(value = "菜单名称")
    private String menuName;

    @ApiModelProperty(value = "菜单Id")
    private String menuId;


    @ApiModelProperty(value = "当前菜单下的所有按钮集合")
    private List<OperationVo> operations;


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @ApiModel(value = "按钮组件")
    public class OperationVo implements Serializable {
        @ApiModelProperty(value = "按钮名称")
        private String name;

        @ApiModelProperty(value = "按钮属性值")
        private String  value;
    }

}
