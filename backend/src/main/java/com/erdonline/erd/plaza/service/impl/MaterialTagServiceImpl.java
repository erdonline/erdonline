package com.erdonline.erd.plaza.service.impl;

import com.erdonline.erd.plaza.entity.MaterialTag;
import com.erdonline.erd.plaza.mapper.MaterialTagMapper;
import com.erdonline.erd.plaza.service.MaterialTagService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * 标签表 服务实现
 *
 * @author 零代科技
 * @version 1.0
 * @date 2024-10-27
 * @describtion
 * @since 1.0
 */
@Service
public class MaterialTagServiceImpl extends MartinServiceImpl<MaterialTagMapper, MaterialTag> implements MaterialTagService {
    @Override
    protected void setEntity() {
        this.clz = MaterialTag.class;
    }
}
