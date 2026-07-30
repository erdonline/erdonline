package com.erdonline.erd.plaza.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.erdonline.erd.plaza.common.PageResult;
import com.erdonline.erd.plaza.entity.Material;
import com.erdonline.erd.plaza.entity.MaterialFavorite;
import com.erdonline.erd.plaza.entity.MaterialLike;
import com.erdonline.erd.plaza.mapper.MaterialFavoriteMapper;
import com.erdonline.erd.plaza.mapper.MaterialLikeMapper;
import com.erdonline.erd.plaza.mapper.MaterialMapper;
import com.erdonline.erd.plaza.service.MaterialService;
import com.erdonline.erd.plaza.vo.request.MaterialQueryRequest;
import com.erdonline.erd.plaza.vo.response.MaterialVO;
import com.erdonline.erd.plaza.vo.response.UserBriefVO;
import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import com.erdonline.common.security.util.SecurityContextUtil;
import lombok.AllArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.Serializable;
import java.util.List;

/**
 * 素材表 服务实现
 *
 * @author 零代科技
 * @version 1.0
 * @date 2024-10-27
 * @describtion
 * @since 1.0
 */
@Service
@AllArgsConstructor
public class MaterialServiceImpl extends MartinServiceImpl<MaterialMapper, Material> implements MaterialService {
    private MaterialLikeMapper materialLikeMapper;
    private MaterialFavoriteMapper materialFavoriteMapper;
    @Override
    public PageResult<MaterialVO> queryMaterials(MaterialQueryRequest request) {
        LambdaQueryWrapper<Material> wrapper = new LambdaQueryWrapper<>();

        if (request.getCategoryId() != null) {
            wrapper.eq(Material::getCategoryId, request.getCategoryId());
        }

        if (request.getKeyword() != null) {
            wrapper.like(Material::getTitle, request.getKeyword())
                    .or()
                    .like(Material::getDescription, request.getKeyword());
        }

        // 添加排序
        if ("hot".equals(request.getSortBy())) {
            wrapper.orderByDesc(Material::getLikes);
        } else if ("newest".equals(request.getSortBy())) {
            wrapper.orderByDesc(Material::getCreateTime);
        }

        Page<Material> page = new Page<>(request.getPage(), request.getPageSize());
        Page<Material> resultPage = page(page, wrapper);
        return PageResult.convert(resultPage, this::convertToVO);
    }

//    private MaterialVO convertToVO(Material material) {
//        MaterialVO vo = new MaterialVO();
//        BeanUtils.copyProperties(material, vo);
//        // 设置额外的属性
//        return vo;
//    }

    @Override
    public MaterialVO getMaterialDetail(String id) {
        Material material = getById(id);
        if (material == null) {
            throw new ValidateException("素材不存在");
        }

        MaterialVO vo = convertToVO(material);
        // 增加浏览次数
        lambdaUpdate()
                .eq(Material::getId, id)
                .setSql("views = views + 1")
                .update();

        return vo;
    }

    @Override
    @Transactional
    public void likeMaterial(String id) {
        // 获取当前用户ID
        String userId = getCurrentUserId();

        // 检查是否已点赞
        boolean exists = materialLikeMapper.exists(
                new LambdaQueryWrapper<MaterialLike>()
                        .eq(MaterialLike::getMaterialId, id)
                        .eq(MaterialLike::getUserId, userId)
        );

        if (exists) {
            throw new ValidateException("已经点赞过了");
        }

        // 添加点赞记录
        MaterialLike like = new MaterialLike();
        like.setMaterialId(id);
        like.setUserId(userId);
        materialLikeMapper.insert(like);

        // 更新素材点赞数
        lambdaUpdate()
                .eq(Material::getId, id)
                .setSql("likes = likes + 1")
                .update();
    }

    @Override
    @Transactional
    public void unlikeMaterial(String id) {
        String userId = getCurrentUserId();

        // 删除点赞记录
        materialLikeMapper.delete(
                new LambdaQueryWrapper<MaterialLike>()
                        .eq(MaterialLike::getMaterialId, id)
                        .eq(MaterialLike::getUserId, userId)
        );

        // 更新素材点赞数
        lambdaUpdate()
                .eq(Material::getId, id)
                .setSql("likes = likes - 1")
                .update();
    }

    @Override
    public void favoriteMaterial(String id) {
        
    }

    @Override
    public void unFavoriteMaterial(String id) {

    }

    @Override
    @Transactional
    public void downloadMaterial(String id) {
        // 更新下载次数
        lambdaUpdate()
                .eq(Material::getId, id)
                .setSql("downloads = downloads + 1")
                .update();

        // TODO: 处理素材下载逻辑
    }

    private String getCurrentUserId() {
        return SecurityContextUtil.getAccessUser().getId();
    }

    private MaterialVO convertToVO(Material material) {
        MaterialVO vo = new MaterialVO();
        BeanUtils.copyProperties(material, vo);

        String userId = getCurrentUserId();

        // 设置点赞状态
        vo.setIsLiked(materialLikeMapper.exists(
                new LambdaQueryWrapper<MaterialLike>()
                        .eq(MaterialLike::getMaterialId, material.getId())
                        .eq(MaterialLike::getUserId, userId)
        ));

        // 设置收藏状态
        vo.setIsFavorited(materialFavoriteMapper.exists(
                new LambdaQueryWrapper<MaterialFavorite>()
                        .eq(MaterialFavorite::getMaterialId, material.getId())
                        .eq(MaterialFavorite::getUserId, userId)
        ));

        // 获取最近点赞用户
//        List<UserBriefVO> recentLikeUsers = materialLikeMapper.getRecentLikeUsers(material.getId());
        vo.setRecentLikeUsers(null);

        return vo;
    }
    @Override
    protected void setEntity() {
        this.clz = Material.class;
    }
}
