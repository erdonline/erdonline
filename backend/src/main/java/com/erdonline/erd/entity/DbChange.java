package com.erdonline.erd.entity;

import cn.hutool.core.date.DateTime;
import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import com.erdonline.common.bean.system.User;
import com.erdonline.common.core.annotation.BindField;
import com.erdonline.common.core.constant.CommonConstants;
import com.erdonline.common.data.mybatis.config.ErdJsonTypeHandler;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Date;

/**
 * <p>
 * 版本表
 * </p>
 *
 * @author 狮少
 * @since 2020-10-28
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
    private JSONArray changes;

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
    private JSONObject projectJSON;

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
