package com.erdonline.erd.plaza.service.impl;

import com.erdonline.erd.plaza.entity.MaterialView;
import com.erdonline.erd.plaza.mapper.MaterialViewMapper;
import com.erdonline.erd.plaza.service.MaterialViewService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * 浏览记录表 服务实现
 *
 * @author 零代科技
 * @version 1.0
 * @date 2024-10-27
 * @describtion
 * @since 1.0
 */
@Service
public class MaterialViewServiceImpl extends MartinServiceImpl<MaterialViewMapper, MaterialView> implements MaterialViewService {
    @Override
    protected void setEntity() {
        this.clz = MaterialView.class;
    }
}
