package com.erdonline.erd.plaza.service;

import com.erdonline.erd.plaza.entity.MaterialLike;
import com.erdonline.common.data.mybatis.service.MartinService;
import org.springframework.transaction.annotation.Transactional;

/**
 * 用户点赞表 服务
 *
 * @author 零代科技
 * @version 1.0
 * @date 2024-10-27
 * @describtion
 * @since 1.0
 */
@Transactional(rollbackFor = Exception.class)
public interface MaterialLikeService extends MartinService<MaterialLike> {

}
