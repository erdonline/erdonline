package com.erdonline.erd.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 版本表。
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName(value = "db_change", autoResultMap = true)
public class DbChange implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private Boolean baseVersion;

    /**
     * 版本变动
     */
    @TableField(value = "changes", typeHandler = JacksonTypeHandler.class)
    private List<Object> changes;

    /**
     * project主键
     */
    private String projectId;

    /**
     * 数据库标识
     */
    private String dbKey;

    /**
     * project配置
     */
    @TableField(value = "projectJSON", typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> projectJSON;

    /**
     * 版本号
     */
    private String version;

    /**
     * 版本创建时间
     */
    private String versionDate;

    /**
     * 版本描述
     */
    private String versionDesc;

    /**
     * 版本标签（逗号分隔，可多个；空则落库为 null；跨版本可复用）
     */
    private String tag;

    /**
     * 创建人
     */
    @TableField(fill = FieldFill.INSERT)
    private String creator;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
