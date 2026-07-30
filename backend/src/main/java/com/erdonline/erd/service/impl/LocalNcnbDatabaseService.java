package com.erdonline.erd.service.impl;

import com.erdonline.common.api.ncnb.RemoteNcnbDatabase;
import com.erdonline.common.core.api.R;
import com.erdonline.erd.entity.DataSources;
import com.erdonline.erd.service.DataSourcesService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * RemoteNcnbDatabase 的本地实现（单体化后取代原 Feign 跨服务调用）。
 *
 * <p>直接查询本地 {@link DataSourcesService}，返回动态数据源切换所需的连接信息，
 * 供 {@code DynamicAspect} 使用。</p>
 */
@Service
@RequiredArgsConstructor
public class LocalNcnbDatabaseService implements RemoteNcnbDatabase {

    private final DataSourcesService dataSourcesService;

    @Override
    public R getDataSourceInfoById(String id) {
        DataSources dataSources = dataSourcesService.getById(id);
        if (dataSources == null) {
            return R.failed("数据源不存在: " + id);
        }
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("driverClassName", dataSources.getDriverClassName());
        info.put("url", dataSources.getUrl());
        info.put("username", dataSources.getUsername());
        info.put("password", dataSources.getPassword());
        return R.ok(info);
    }
}
