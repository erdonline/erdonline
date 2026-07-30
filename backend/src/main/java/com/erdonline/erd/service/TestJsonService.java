package com.erdonline.erd.service;

import com.erdonline.erd.entity.TestJson;
import com.erdonline.common.data.mybatis.service.MartinService;
import org.springframework.transaction.annotation.Transactional;

/**
 * <p>
 *  服务类
 * </p>
 *
 * @author 零代科技
 * @version 1.0
 * @date 2023-02-26
 * @describtion
 * @since 1.0
 */
@Transactional(rollbackFor = Exception.class)
public interface TestJsonService extends MartinService<TestJson> {

}
