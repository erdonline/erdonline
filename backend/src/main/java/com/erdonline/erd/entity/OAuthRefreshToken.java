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
 * OAuth refresh_token（ADR-0013 post-MVP）。仅存哈希；轮换时旧票 revoked。
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("oauth_refresh_token")
public class OAuthRefreshToken implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /** SHA-256 hex；永不写明文 */
    private String tokenHash;

    private String tokenHint;

    /** 轮换族 id；复用已吊销成员 → 整族吊销 */
    private String familyId;

    private String clientPk;

    private String clientId;

    private String userId;

    private String username;

    private String scopes;

    private LocalDateTime expireTime;

    /** 0 有效 / 1 已吊销 */
    private String revoked;

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
