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
 * OAuth authorization_code（ADR-0013 切片 B）。仅存 code 哈希。
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("oauth_authorization_code")
public class OAuthAuthorizationCode implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String codeHash;

    private String clientPk;

    private String clientId;

    private String userId;

    private String username;

    private String redirectUri;

    private String scopes;

    private String codeChallenge;

    private String codeChallengeMethod;

    private LocalDateTime expireTime;

    /** 0 未用 / 1 已消费 */
    private String consumed;

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
