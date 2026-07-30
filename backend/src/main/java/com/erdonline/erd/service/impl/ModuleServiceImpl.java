package com.erdonline.erd.service.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.CharUtil;
import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.conditions.query.LambdaQueryChainWrapper;
import com.baomidou.mybatisplus.extension.conditions.query.QueryChainWrapper;
import com.erdonline.common.core.api.R;
import com.erdonline.common.core.constant.ProjectConstants;
import com.erdonline.erd.entity.Module;
import com.erdonline.erd.mapper.ModuleMapper;
import com.erdonline.erd.service.JsonBaseService;
import com.erdonline.erd.service.ModuleService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * <p>
 * 模块 服务实现类
 * </p>
 *
 * @author 零代科技
 * @version 1.0
 * @date 2023-03-04
 * @describtion
 * @since 1.0
 */
@Slf4j
@Service
public class ModuleServiceImpl extends MartinServiceImpl<ModuleMapper, Module> implements ModuleService {
    @Override
    protected void setEntity() {
        this.clz = Module.class;
    }

    @Override
    public JSONObject getModuleById(String id, String name) {
        return baseMapper.getModuleById(id, name);
    }

}
