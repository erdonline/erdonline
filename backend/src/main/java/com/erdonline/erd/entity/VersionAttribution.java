package com.erdonline.erd.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.Accessors;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 版本保存归因（append-only）。推广链路：渠道 → 北极星（非空存版）可查。
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Accessors(chain = true)
@TableName("version_attribution")
public class VersionAttribution implements Serializable {

    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    private String dbChangeId;

    private String projectId;

    private String dbKey;

    private String version;

    private String username;

    private String utmSource;

    private String utmMedium;

    private String utmCampaign;

    private String utmContent;

    private String utmTerm;

    private String referrer;

    private String landing;

    private Long attrTs;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
