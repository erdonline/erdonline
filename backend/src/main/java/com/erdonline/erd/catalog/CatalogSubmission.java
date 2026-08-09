package com.erdonline.erd.catalog;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Accessors(chain = true)
@TableName("catalog_submission")
public class CatalogSubmission implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String projectId;

    private String submitterUserId;

    private String title;

    private String description;

    private String tags;

    /** pending | approved | rejected */
    private String status;

    private String reviewerUserId;

    private String reviewNote;

    private String templateId;

    @TableLogic
    private String delFlag;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
