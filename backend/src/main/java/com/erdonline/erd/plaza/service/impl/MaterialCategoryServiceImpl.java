package com.erdonline.erd.plaza.service.impl;

import com.erdonline.erd.plaza.entity.MaterialCategory;
import com.erdonline.erd.plaza.mapper.MaterialCategoryMapper;
import com.erdonline.erd.plaza.service.MaterialCategoryService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * 素材分类表 服务实现
 *
 * @author 零代科技
 * @version 1.0
 * @date 2024-10-27
 * @describtion
 * @since 1.0
 */
@Service
public class MaterialCategoryServiceImpl extends MartinServiceImpl<MaterialCategoryMapper, MaterialCategory> implements MaterialCategoryService {
    @Override
    protected void setEntity() {
        this.clz = MaterialCategory.class;
    }
}
