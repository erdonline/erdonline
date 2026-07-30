package com.erdonline.common.bean.system.mapstruct;

import com.erdonline.common.bean.system.Menu;
import com.erdonline.common.bean.system.vo.RoleMenuTreeVo;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.factory.Mappers;

import java.util.List;

/**
 * @author 狮少
 * @version 1.0
 * @date 2020/8/28
 * @describtion 角色菜单转换器
 * @since 1.0
 */
@Mapper
public interface RoleMenuNodeConverter {
    RoleMenuNodeConverter INSTANCE = Mappers.getMapper(RoleMenuNodeConverter.class);

    /**
     * 数据库menu转页面需要的node
     *
     * @param menu
     * @return
     */
    @Mappings({
            @Mapping(source = "id", target = "key"),
            @Mapping(source = "name", target = "title"),
            @Mapping(source = "menuId", target = "parentId"),
    })
    RoleMenuTreeVo po2dto(Menu menu);

    /**
     * 数据库node转页面需要的node,批量转换
     *
     * @param list
     * @return
     */
    List<RoleMenuTreeVo> po2dto(List<Menu> list);
}
