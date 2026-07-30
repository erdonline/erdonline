package com.erdonline.erd.entity;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Date;

import cn.hutool.core.date.DateTime;
import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableName;
import com.erdonline.common.bean.system.User;
import com.erdonline.common.core.annotation.BindField;
import com.erdonline.common.core.constant.CommonConstants;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

/**
 * <p>
 *
 * </p>
 *
 * @author 狮少
 * @since 2020-10-29
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("db_version")
public class DbVersion implements Serializable {

    @TableId(type= IdType.ASSIGN_UUID)
    private String id;

    private String dbVersion;

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

    private String projectId;

    private String dbKey;


}
