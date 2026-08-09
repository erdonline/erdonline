package com.erdonline.erd.catalog;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import com.erdonline.common.data.mybatis.config.ErdJsonTypeHandler;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Accessors(chain = true)
@TableName(value = "catalog_template", autoResultMap = true)
public class CatalogTemplate implements Serializable {

    @TableId(type = IdType.INPUT)
    private String id;

    private String slug;

    private String title;

    private String description;

    private String tags;

    private String authorHandle;

    private String authorDisplayName;

    @TableField(value = "project_json", typeHandler = ErdJsonTypeHandler.class)
    private Map<String, Object> projectJson;

    @TableField(value = "config_json", typeHandler = ErdJsonTypeHandler.class)
    private Map<String, Object> configJson;

    /** published | pending | rejected */
    private String status;

    private Integer installCount;

    private Integer ratingSum;

    private Integer ratingCount;

    private String sourceProjectId;

    @TableLogic
    private String delFlag;

    @TableField(fill = FieldFill.INSERT)
    private String creator;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private String updater;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
