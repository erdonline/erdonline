package com.erdonline.erd.plaza.service.impl;

import com.erdonline.erd.plaza.entity.MaterialLike;
import com.erdonline.erd.plaza.mapper.MaterialLikeMapper;
import com.erdonline.erd.plaza.service.MaterialLikeService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * 用户点赞表 服务实现
 *
 * @author 零代科技
 * @version 1.0
 * @date 2024-10-27
 * @describtion
 * @since 1.0
 */
@Service
public class MaterialLikeServiceImpl extends MartinServiceImpl<MaterialLikeMapper, MaterialLike> implements MaterialLikeService {
    @Override
    protected void setEntity() {
        this.clz = MaterialLike.class;
    }
}
