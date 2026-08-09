package com.erdonline.erd.dto;

import com.erdonline.common.bean.system.dto.BaseTreeNode;
import lombok.Data;

/**
 * 字段库树节点。
 */
@Data
public class DataDictTreeNode extends BaseTreeNode {
    private String dictCode;
    private String description;
    private Integer usageCount;
    private DataDictInfoDto dictInfo;
    private String scopeType;
    private String scopeId;
    /** platform 条目前端只读 */
    private Boolean readOnly;
}
