package com.erdonline.erd.dto;

import com.erdonline.common.bean.system.dto.BaseTreeNode;
import lombok.Data;

import java.util.List;

/**
 * 数据字典树节点。
 */
@Data
public class DataDictTreeNode extends BaseTreeNode {
    private String dictCode;
    private String description;
    private Integer usageCount;
    private List<Object> dictInfo;
}
