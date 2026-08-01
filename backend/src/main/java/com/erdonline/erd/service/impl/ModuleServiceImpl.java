package com.erdonline.erd.service.impl;

import com.erdonline.erd.entity.Module;
import com.erdonline.erd.mapper.ModuleMapper;
import com.erdonline.erd.service.ModuleService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * 模块服务实现。
 */
@Slf4j
@Service
public class ModuleServiceImpl extends MartinServiceImpl<ModuleMapper, Module> implements ModuleService {
    @Override
    protected void setEntity() {
        this.clz = Module.class;
    }

    @Override
    public Map<String, Object> getModuleById(String id, String name) {
        return baseMapper.getModuleById(id, name);
    }
}
