package com.erdonline.common.bean.system.vo;

import com.erdonline.common.bean.system.dto.BaseTreeNode;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * @author 狮少
 * @version 1.0
 * @date 2020/8/28
 * @describtion RoleMenuTreeVo
 * @since 1.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "角色的菜单树")
@EqualsAndHashCode(callSuper = true)
public class RoleMenuTreeVo extends BaseTreeNode {
    @ApiModelProperty(value = "菜单名称")
    private String title;

    @ApiModelProperty(value = "任意值")
    private String key;
}
