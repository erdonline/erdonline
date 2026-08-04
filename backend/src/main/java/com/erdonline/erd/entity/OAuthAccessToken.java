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
 * OAuth client_credentials 签发的 access token（ADR-0013）。仅存哈希。
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("oauth_access_token")
public class OAuthAccessToken implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String clientPk;

    private String clientId;

    private String userId;

    private String username;

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
