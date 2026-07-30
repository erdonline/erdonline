package com.erdonline.erd.service.impl;

import com.erdonline.erd.entity.QueryHistory;
import com.erdonline.erd.mapper.QueryHistoryMapper;
import com.erdonline.erd.service.QueryHistoryService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * <p>
 * sql执行记录表  服务实现类
 * </p>
 *
 * @author zerocode
 * @version 1.0
 * @date 2022-12-03
 * @describtion
 * @since 1.0
 */
@Service
public class QueryHistoryServiceImpl extends MartinServiceImpl<QueryHistoryMapper, QueryHistory> implements QueryHistoryService {
    @Override
    protected void setEntity() {
        this.clz = QueryHistory.class;
    }

    @Override
    public void saveLog(QueryHistory queryHistory) {

    }
}
