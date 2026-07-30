package com.erdonline.common.api.ncnb;

import com.erdonline.common.core.api.R;

/**
 * 动态数据源信息查询接口。
 *
 * <p>单体化前为 Feign 客户端（跨服务调用 ncnb 获取数据源连接信息），
 * 单体化后由 erd 模块的 {@code LocalNcnbDatabaseService} 本地实现。</p>
 */
public interface RemoteNcnbDatabase {
    /**
     * 根据数据源 id 获取连接信息（driverClassName/url/username/password）。
     *
     * @param id 数据源 id
     * @return R，data 为包含连接信息的 Map
     */
    R getDataSourceInfoById(String id);
}
