package com.erdonline.erd.service.impl;

import com.erdonline.common.api.ncnb.RemoteNcnbDatabase;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.erd.entity.DataSources;
import com.erdonline.erd.security.DataSourceAcl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * RemoteNcnbDatabase 的本地实现（单体化后取代原 Feign 跨服务调用）。
 *
 * <p>{@code DynamicAspect}（供 {@code @Dynamic} 注解的 queryInfo/exec、explain 等任意 SQL
 * 执行路径切换目标数据源）唯一的凭证来源。<b>必须</b>走 {@link DataSourceAcl#requireOwned}
 * 做归属校验——此前直接 {@code dataSourcesService.getById(id)} 无任何 ACL，任意登录用户
 * 只要能猜到/枚举出别人的 {@code data_sources.id} 就能拿到明文库连接信息并对其执行任意
 * 只读 SQL（跨租户凭证泄露 + 数据越权读取），是本轮审计发现的最高危漏洞。</p>
 */
@Service
@RequiredArgsConstructor
public class LocalNcnbDatabaseService implements RemoteNcnbDatabase {

    private final DataSourceAcl dataSourceAcl;

    @Override
    public R getDataSourceInfoById(String id) {
        // requireOwned 对「不存在」与「存在但不属于我」统一返回 403，不区分，
        // 避免通过错误信息差异枚举出别人真实存在的 dataSourceId。
        DataSources dataSources;
        try {
            dataSources = dataSourceAcl.requireOwned(id);
        } catch (ValidateException e) {
            return R.failed(ApiErrorCode.FORBIDDEN.getCode(), "非法的数据源: " + id);
        }
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("driverClassName", dataSources.getDriverClassName());
        info.put("url", dataSources.getUrl());
        info.put("username", dataSources.getUsername());
        info.put("password", dataSources.getPassword());
        return R.ok(info);
    }
}
