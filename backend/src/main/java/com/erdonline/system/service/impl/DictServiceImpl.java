package com.erdonline.system.service.impl;

import com.erdonline.common.bean.system.Dict;
import com.erdonline.system.mapper.DictMapper;
import com.erdonline.system.service.DictService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 系统字典 服务实现类
 * </p>
 *
 * @author 狮少
 * @version 1.0
 * @date 2021-05-08
 * @describtion
 * @since 1.0
 */
@Service
public class DictServiceImpl extends MartinServiceImpl<DictMapper, Dict> implements DictService {
    @Override
    protected void setEntity() {
        this.clz = Dict.class;
    }
}
