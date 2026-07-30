package com.erdonline.erd.service;

import com.alibaba.fastjson.JSONObject;
import com.erdonline.common.core.api.R;
import com.erdonline.erd.entity.Module;
import com.erdonline.common.data.mybatis.service.MartinService;
import org.springframework.transaction.annotation.Transactional;

/**
 * <p>
 * 模块 服务类
 * </p>
 *
 * @author 零代科技
 * @version 1.0
 * @date 2023-03-04
 * @describtion
 * @since 1.0
 */
@Transactional(rollbackFor = Exception.class)
public interface ModuleService extends MartinService<Module> {

    JSONObject getModuleById(String id, String name);

}
