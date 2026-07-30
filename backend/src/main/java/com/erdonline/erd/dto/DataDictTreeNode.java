package com.erdonline.erd.dto;

import com.alibaba.fastjson.JSONArray;
import com.erdonline.common.bean.system.dto.BaseTreeNode;
import lombok.Data;

/**
 * @author: 零代科技
 * @version: 1.0
 * @date: 2024/9/20 22:06
 * @describtion: QueryInfoTreeNode
 */
@Data
public class DataDictTreeNode extends BaseTreeNode {
    // 字典代码，唯一标识一个字典项
    private String dictCode;

    // 描述，用于详细说明字典项的含义或用途
    private String description;

    // 使用次数，记录该字典项被使用的频率
    private Integer usageCount;

    // 存储字典信息的JSON数组
    private JSONArray dictInfo;
}
