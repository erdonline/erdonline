package com.erdonline.erd.plaza.service.impl;

import com.erdonline.erd.plaza.entity.MaterialFavorite;
import com.erdonline.erd.plaza.mapper.MaterialFavoriteMapper;
import com.erdonline.erd.plaza.service.MaterialFavoriteService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * 用户收藏表 服务实现
 *
 * @author 零代科技
 * @version 1.0
 * @date 2024-10-27
 * @describtion
 * @since 1.0
 */
@Service
public class MaterialFavoriteServiceImpl extends MartinServiceImpl<MaterialFavoriteMapper, MaterialFavorite> implements MaterialFavoriteService {
    @Override
    protected void setEntity() {
        this.clz = MaterialFavorite.class;
    }
}
