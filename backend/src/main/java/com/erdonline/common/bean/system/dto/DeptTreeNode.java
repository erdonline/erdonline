package com.erdonline.common.bean.system.dto;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/9/19
 * @describtion DeptTree, 部门树
 * @since 1.0
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "部门树")
@EqualsAndHashCode(callSuper = true)
public class DeptTreeNode extends BaseTreeNode {
    @ApiModelProperty(value = "部门名称")
    private String name;

    @ApiModelProperty(value = "部门所在地")
    private String address;

    @ApiModelProperty(value = "部门电话")
    private String phone;

    @ApiModelProperty(value = "部门级别")
    private Integer deptLevel;

    @ApiModelProperty(value = "排序")
    private Integer sort;


}
