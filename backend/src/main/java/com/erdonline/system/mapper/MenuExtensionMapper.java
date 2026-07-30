package com.erdonline.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.erdonline.common.bean.system.Menu;
import com.erdonline.common.bean.system.Role;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Set;

/**
 * <p>
 * 系统菜单 Mapper 接口
 * </p>
 *
 * @author 狮少
 * @date 2019-10-18
 */
public interface MenuExtensionMapper extends BaseMapper<Menu> {

    /**
     * 获取所有ui所需要的菜单信息
     *
     * @return List<Menu>
     */
    List<Menu> getAllUiMenu();

    /**
     * 角色分配菜单时，获取所有菜单
     *
     * @return
     */
    List<Menu> getAllMenus();

    /**
     * 角色分配菜单时，获取所有已分配菜单
     *
     * @param role
     * @return
     */
    List<Menu> getSelectMenus(Role role);

    /**
     * 获取当前登录用户所的有菜单
     *
     * @param roleIds
     * @return
     */
    List<Menu> getCurrentUserMenusByRoles(Set<String> roleIds);

    /**
     * 交换两个菜单的排序字段
     *
     * @param id1
     * @param id2
     * @return
     */
    Integer exchangeSort(@Param("id1") Integer id1, @Param("id2") Integer id2);

    /**
     * 获取当前排序最大值
     *
     * @return
     */
    Integer getMaxSort();

}
