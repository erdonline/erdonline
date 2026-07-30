package com.erdonline.system.service.impl;

import com.erdonline.common.bean.system.Config;
import com.erdonline.system.mapper.ConfigMapper;
import com.erdonline.system.service.ConfigService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 系统配置  服务实现类
 * </p>
 *
 * @author 狮少
 * @version 1.0
 * @date 2021-05-08
 * @describtion
 * @since 1.0
 */
@Service
public class ConfigServiceImpl extends MartinServiceImpl<ConfigMapper, Config> implements ConfigService {
    @Override
    protected void setEntity() {
        this.clz = Config.class;
    }
}
