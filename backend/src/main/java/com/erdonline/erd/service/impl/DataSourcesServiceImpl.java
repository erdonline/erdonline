package com.erdonline.erd.service.impl;

import com.erdonline.erd.entity.DataSources;
import com.erdonline.erd.mapper.DataSourcesMapper;
import com.erdonline.erd.service.DataSourcesService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * 数据源 服务实现
 *
 * @author 零代科技
 * @version 1.0
 * @date 2024-09-07
 * @describtion
 * @since 1.0
 */
@Service
public class DataSourcesServiceImpl extends MartinServiceImpl<DataSourcesMapper, DataSources> implements DataSourcesService {
    @Override
    protected void setEntity() {
        this.clz = DataSources.class;
    }
}
