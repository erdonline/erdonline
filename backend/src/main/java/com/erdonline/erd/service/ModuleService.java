package com.erdonline.erd.service;

import com.erdonline.erd.entity.Module;
import com.erdonline.common.data.mybatis.service.MartinService;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * 模块服务。
 */
@Transactional(rollbackFor = Exception.class)
public interface ModuleService extends MartinService<Module> {

    Map<String, Object> getModuleById(String id, String name);
}
