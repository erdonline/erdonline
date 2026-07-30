package com.erdonline.erd.service;

import com.erdonline.erd.entity.DataDict;
import com.erdonline.common.data.mybatis.service.MartinService;
import org.springframework.transaction.annotation.Transactional;

/**
 * 数据字典表  服务
 *
 * @author 零代科技
 * @version 1.0
 * @date 2024-10-05
 * @describtion
 * @since 1.0
 */
@Transactional(rollbackFor = Exception.class)
public interface DataDictService extends MartinService<DataDict> {

}
