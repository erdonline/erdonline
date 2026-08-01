package com.erdonline.common.data.mybatis.bean;

import com.baomidou.mybatisplus.annotation.FieldStrategy;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.erdonline.common.data.AtLeastOneNotNull;
import com.erdonline.common.data.mybatis.config.ErdJsonTypeHandler;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.util.Map;

/**
 * @author: 零代科技
 * @version: 1.0
 * @date: 2023/3/4 16:38
 * @describtion: JsonBase
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName(value = "project", autoResultMap = true)
@AtLeastOneNotNull(fieldNames = {"path", "name"}, message = "path，name 至少有一个不为为空")
public class JsonBase {

    @ApiModelProperty(value = "主键")
    protected String id;

    @ApiModelProperty(value = "json path")
    protected String path;

    @ApiModelProperty(value = "json name")
    protected String name;

    @ApiModelProperty(value = "json value")
    @TableField(insertStrategy = FieldStrategy.NEVER,
            updateStrategy = FieldStrategy.NEVER,
            select = false,
            typeHandler = ErdJsonTypeHandler.class)
    protected Map<String, Object> json;

//    @ApiModelProperty(value = "value")
//    protected Object value;

}
