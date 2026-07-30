package com.erdonline.common.bean.system.mapstruct;

import com.erdonline.common.bean.system.Dept;
import com.erdonline.common.bean.system.dto.DeptTreeNode;
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
public interface DeptTreeNodeConverter {
    DeptTreeNodeConverter INSTANCE = Mappers.getMapper(DeptTreeNodeConverter.class);

    /**
     * 数据库node转页面需要的node
     *
     * @param menu
     * @return
     */
    @Mappings({
            @Mapping(source = "deptId", target = "parentId"),
    })
    DeptTreeNode po2dto(Dept dept);

    /**
     * 数据库node转页面需要的node,批量转换
     *
     * @param list
     * @return
     */
    List<DeptTreeNode> po2dto(List<Dept> list);
}
