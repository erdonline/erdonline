package com.erdonline.erd.service;

import com.erdonline.erd.entity.DataSources;
import com.erdonline.common.data.mybatis.service.MartinService;
import org.springframework.transaction.annotation.Transactional;

/**
 * 数据源 服务
 *
 * @author 零代科技
 * @version 1.0
 * @date 2024-09-07
 * @describtion
 * @since 1.0
 */
@Transactional(rollbackFor = Exception.class)
public interface DataSourcesService extends MartinService<DataSources> {

}
