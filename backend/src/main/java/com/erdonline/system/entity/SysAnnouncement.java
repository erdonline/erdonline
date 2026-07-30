package com.erdonline.system.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import java.time.LocalDateTime;
import com.baomidou.mybatisplus.annotation.TableLogic;
import java.io.Serializable;
import com.erdonline.common.bean.system.User;
import com.erdonline.common.core.annotation.BindField;
import com.erdonline.common.core.constant.CommonConstants;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

/**
 * <p>
 * 公告表 
 * </p>
 *
 * @author 零代科技
 * @version 1.0
 * @date 2023-10-04
 * @describtion
 * @since 1.0
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@ApiModel(value="SysAnnouncement对象", description="公告表 ")
public class SysAnnouncement implements Serializable {

    private static final long serialVersionUID=1L;

    @ApiModelProperty(value = "主键")
    private String id;

    @ApiModelProperty(value = "标题")
    private String title;

    @ApiModelProperty(value = "内容")
    private String content;

    @ApiModelProperty(value = "跳转地址")
    private String url;

    @ApiModelProperty(value = "删除标识（0-正常,1-删除）")
    @TableLogic
    private String delFlag;

    @ApiModelProperty(value = "乐观锁")
    private Integer revision;

    @ApiModelProperty(value = "创建人")
    private String creator;

    @ApiModelProperty(value = "创建时间")
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @ApiModelProperty(value = "更新人")
    private String updater;

    @ApiModelProperty(value = "更新时间")
    @TableField(fill = FieldFill.UPDATE)
    private LocalDateTime updateTime;


}
