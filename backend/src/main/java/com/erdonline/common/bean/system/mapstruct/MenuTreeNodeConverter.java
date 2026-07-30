package com.erdonline.common.bean.system.mapstruct;

import com.erdonline.common.bean.system.Menu;
import com.erdonline.common.bean.system.dto.MenuTreeNode;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.mapstruct.factory.Mappers;

import java.util.List;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/9/19
 * @describtion MenuTreeNodeConverter
 * @since 1.0
 */
@Mapper
public interface MenuTreeNodeConverter {
    MenuTreeNodeConverter INSTANCE = Mappers.getMapper(MenuTreeNodeConverter.class);

    /**
     * 数据库node转页面需要的node
     *
     * @param menu
     * @return
     */
    @Mappings({
            @Mapping(source = "uiKey", target = "key"),
            @Mapping(source = "menuId", target = "parentId"),
    })
    MenuTreeNode po2dto(Menu menu);

    /**
     * 数据库node转页面需要的node,批量转换
     *
     * @param list
     * @return
     */
    List<MenuTreeNode> po2dto(List<Menu> list);
}
