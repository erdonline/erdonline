package com.erdonline.erd.service;

import com.erdonline.common.data.dynamic.annotation.Dynamic;
import com.erdonline.erd.entity.QueryHistory;
import com.erdonline.common.data.mybatis.service.MartinService;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * <p>
 * sql执行记录表  服务类
 * </p>
 *
 * @author zerocode
 * @version 1.0
 * @date 2022-12-03
 * @describtion
 * @since 1.0
 */
@Transactional(rollbackFor = Exception.class)
public interface QueryHistoryService extends MartinService<QueryHistory> {


    /**
     * 保存日志
     *
     * @param queryHistory
     */
    @Dynamic
    void saveLog(QueryHistory queryHistory);
}
