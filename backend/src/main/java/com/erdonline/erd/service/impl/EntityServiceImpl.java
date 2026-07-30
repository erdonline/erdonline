package com.erdonline.erd.service.impl;

import com.erdonline.erd.entity.Entity;
import com.erdonline.erd.mapper.EntityMapper;
import com.erdonline.erd.service.EntityService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 元数据 服务实现类
 * </p>
 *
 * @author 零代科技
 * @version 1.0
 * @date 2023-03-04
 * @describtion
 * @since 1.0
 */
@Service
public class EntityServiceImpl extends MartinServiceImpl<EntityMapper, Entity> implements EntityService {
    @Override
    protected void setEntity() {
        this.clz = Entity.class;
    }
}
