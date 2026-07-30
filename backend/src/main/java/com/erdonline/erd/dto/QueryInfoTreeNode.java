package com.erdonline.erd.dto;

import com.erdonline.common.bean.system.dto.BaseTreeNode;
import lombok.Data;

/**
 * @author: 零代科技
 * @version: 1.0
 * @date: 2024/9/20 22:06
 * @describtion: QueryInfoTreeNode
 */
@Data
public class QueryInfoTreeNode extends BaseTreeNode {
    // 项目ID，用于唯一标识一个项目
    private String projectId;
}
