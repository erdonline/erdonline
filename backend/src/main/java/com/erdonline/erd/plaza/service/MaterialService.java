package com.erdonline.erd.plaza.service;

import com.erdonline.erd.plaza.common.PageResult;
import com.erdonline.erd.plaza.entity.Material;
import com.erdonline.erd.plaza.vo.request.MaterialQueryRequest;
import com.erdonline.erd.plaza.vo.response.MaterialVO;
import com.erdonline.common.data.mybatis.service.MartinService;
import org.springframework.transaction.annotation.Transactional;


/**
 * 素材表 服务
 *
 * @author 零代科技
 * @version 1.0
 * @date 2024-10-27
 * @describtion
 * @since 1.0
 */
@Transactional(rollbackFor = Exception.class)
public interface MaterialService extends MartinService<Material> {

    PageResult<MaterialVO> queryMaterials(MaterialQueryRequest request);

    MaterialVO getMaterialDetail(String id);

    void likeMaterial(String id);

    void unlikeMaterial(String id);

    void favoriteMaterial(String id);

    void unFavoriteMaterial(String id);

    void downloadMaterial(String id);
}
