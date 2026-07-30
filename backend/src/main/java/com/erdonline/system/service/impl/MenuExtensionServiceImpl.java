package com.erdonline.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.erdonline.system.mapper.MenuExtensionMapper;
import com.erdonline.system.service.MenuExtensionService;
import com.erdonline.common.bean.system.Menu;
import com.erdonline.common.bean.system.Role;
import com.erdonline.common.bean.system.dto.MenuTreeNode;
import com.erdonline.common.bean.system.vo.RoleMenuTreeVo;
import com.erdonline.common.bean.util.TreeUtil;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.common.core.constant.CommonConstants;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.common.security.util.SecurityContextUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Set;

/**
 * <p>
 * 系统菜单 服务实现类
 * </p>
 *
 * @author 狮少
 * @date 2019-10-18
 */
@Slf4j
@Service
public class MenuExtensionServiceImpl extends MartinServiceImpl<MenuExtensionMapper, Menu> implements MenuExtensionService {

    @Override
    public List<Menu> getAllUiMenu() {
        return baseMapper.getAllUiMenu();
    }

    @Override
    public Object insert(Menu menu) {
        return baseMapper.insert(menu);
    }

    @Override
    public R getCurrentUserMenusByRoles() {
        Set<String > roleIds = SecurityContextUtil.getAccessUser().getRoleIds();
        List<Menu> list = baseMapper.getCurrentUserMenusByRoles(roleIds);
        HashMap<String, Menu> map = new HashMap<>();
        for (Menu menu : list) {
            map.put(menu.getId(), menu);
        }
        for (int i = 0; i < list.size(); i++) {
            String parentId = list.get(i).getMenuId();
            if (CommonConstants.MENU_ROOT.equals(parentId)) {
                list.get(i).setParentKey("/");
            } else {
                list.get(i).setParentKey(map.get(parentId) != null ? map.get(parentId).getPath() : "");
            }
        }
        List<MenuTreeNode> routes = TreeUtil.buildMenuTreeByRecursive(list, CommonConstants.MENU_ROOT);
        return R.ok(routes);
    }

    @Override
    public HashMap<String, Object> getAllMenuByRole(Role role) {
        List<Menu> menus = baseMapper.getAllMenus();
        List<Menu> selectMenus = baseMapper.getSelectMenus(role);
        List<RoleMenuTreeVo> roleMenuTreeVos = TreeUtil.buildRoleMenusByMenus(menus, CommonConstants.MENU_ROOT);
        List<String> defaultSelectedKeys = new ArrayList<>();
        selectMenus.stream().forEach(m -> defaultSelectedKeys.add(m.getId().toString()));
        HashMap<String, Object> map = new HashMap<>(2);
        map.put("treeData", roleMenuTreeVos);
        map.put("defaultSelectedKeys", defaultSelectedKeys);
        return map;
    }

    @Override
    public List getAllMenuTree() {
        Menu menu = new Menu();
        QueryWrapper<Menu> query = Wrappers.query(menu);
        query.orderByAsc("sort");
        List<Menu> list = this.list(query);
        List<MenuTreeNode> menuTree = TreeUtil.buildMenuTreeByRecursive(list, CommonConstants.MENU_ROOT);
        return menuTree;
    }

    @Override
    public R exchangeSort(List<Integer> list) {
        if (list.size() != 2) {
            R.failed("传入的参数有误，请检查传参是否正确！");
        }
        Integer id1 = list.get(0);
        Integer id2 = list.get(1);
        return R.ok(baseMapper.exchangeSort(id1, id2));
    }

    @Override
    public Integer getMaxSort() {
        return baseMapper.getMaxSort();
    }


    @Override
    protected void setEntity() {
        this.clz = Menu.class;
    }
}
