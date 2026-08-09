package com.erdonline.erd.service;

import com.erdonline.erd.dto.DataDictApplyResult;
import com.erdonline.erd.entity.DataDict;
import com.erdonline.common.data.mybatis.service.MartinService;
import com.erdonline.common.bean.system.dto.BaseTreeNode;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 字段库服务。
 */
@Transactional(rollbackFor = Exception.class)
public interface DataDictService extends MartinService<DataDict> {

    List<BaseTreeNode> tree(DataDict entity, String projectId);

    DataDictApplyResult apply(String id);

    boolean createDict(DataDict dataDict);

    boolean updateDict(String id, DataDict dataDict);

    boolean deleteDict(String id);
}
