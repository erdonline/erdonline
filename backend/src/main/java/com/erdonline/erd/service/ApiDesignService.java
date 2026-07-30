package com.erdonline.erd.service;

import com.erdonline.erd.entity.ApiDesign;
import com.baomidou.mybatisplus.extension.service.IService;
import org.springframework.transaction.annotation.Transactional;

/**
 * <p>
 * api设计表 服务类
 * </p>
 *
 * @author shishao
 * @version 1.0
 * @date 2020-12-10
 * @describtion
 * @since 1.0
 */
@Transactional(rollbackFor = Exception.class)
public interface ApiDesignService extends IService<ApiDesign> {

}
