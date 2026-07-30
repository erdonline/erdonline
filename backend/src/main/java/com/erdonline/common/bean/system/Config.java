package com.erdonline.common.bean.system;

import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import java.time.LocalDateTime;
import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import java.io.Serializable;
import com.erdonline.common.core.annotation.BindField;
import com.erdonline.common.core.constant.CommonConstants;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

/**
 * <p>
 * 系统配置
 * </p>
 *
 * @author 狮少
 * @version 1.0
 * @date 2021-08-06
 * @describtion
 * @since 1.0
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("sys_config")
@ApiModel(value="Config对象", description="系统配置 ")
public class Config implements Serializable {

    private static final long serialVersionUID=1L;

    @ApiModelProperty(value = "主键")
    @TableId(value = "ID", type = IdType.ASSIGN_UUID)
    private String id;

    @ApiModelProperty(value = "名称")
    @TableField("NAME")
    private String name;

    @ApiModelProperty(value = "配置值")
    @TableField("VALUE")
    private String value;

    @ApiModelProperty(value = "配置关键字")
    @TableField("TYPE")
    private String type;

    @ApiModelProperty(value = "租户")
    @TableField("TENANT_ID")
    private String tenantId;

    @ApiModelProperty(value = "删除标识（0-正常,1-删除）")
    @TableField("DEL_FLAG")
    private String delFlag;

    @ApiModelProperty(value = "创建时间")
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @ApiModelProperty(value = "更新时间")
    @TableField(fill = FieldFill.UPDATE)
    private LocalDateTime updateTime;

    @ApiModelProperty(value = "创建人")
    @TableField(value = "CREATOR", fill = FieldFill.INSERT)
    @BindField(entity = User.class, field = CommonConstants.USER_USERNAME)
    private String creator;

    @ApiModelProperty(value = "修改人")
    @TableField(value = "UPDATER", fill = FieldFill.UPDATE)
    @BindField(entity = User.class, field = CommonConstants.USER_USERNAME)
    private String updater;


}
