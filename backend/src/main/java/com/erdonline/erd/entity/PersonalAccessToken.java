package com.erdonline.erd.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 公开 API 个人访问令牌（ADR-0013）。仅存哈希，无明文。
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("personal_access_token")
public class PersonalAccessToken implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String userId;

    private String username;

    private String name;

    /** SHA-256 hex；永不写明文 */
    private String tokenHash;

    private String tokenHint;

    private String scopes;

    private LocalDateTime expireTime;

    /** 0 有效 / 1 已吊销 */
    private String revoked;

    private LocalDateTime lastUsedTime;

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
