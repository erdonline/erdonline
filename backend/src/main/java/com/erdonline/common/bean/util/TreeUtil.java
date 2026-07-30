package com.erdonline.common.bean.util;

import com.erdonline.common.bean.system.Dept;
import com.erdonline.common.bean.system.Menu;
import com.erdonline.common.bean.system.dto.BaseTreeNode;
import com.erdonline.common.bean.system.dto.DeptTreeNode;
import com.erdonline.common.bean.system.dto.MenuTreeNode;
import com.erdonline.common.bean.system.mapstruct.DeptTreeNodeConverter;
import com.erdonline.common.bean.system.mapstruct.MenuTreeNodeConverter;
import com.erdonline.common.bean.system.mapstruct.RoleMenuNodeConverter;
import com.erdonline.common.bean.system.vo.RoleMenuTreeVo;
import lombok.experimental.UtilityClass;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/9/19
 * @describtion TreeUtil
 * @since 1.0
 * <p>
 * If a class is annotated with @UtilityClass, the following things happen to it:
 * It is marked final.
 * If any constructors are declared in it, an error is generated. Otherwise, a private no-args constructor is generated; it throws a UnsupportedOperationException.
 * All methods, inner classes, and fields in the class are marked static.
 * WARNING: Do not use non-star static imports to import these members; javac won't be able to figure it out. Use either: import static ThisType.*; or don't static-import.
 */

@UtilityClass
public class TreeUtil {
    /**
     * 递归获取所有子节点
     *
     * @param treeNodes 所有节点
     * @param root      父节点
     * @param <T>
     * @return
     */
    public <T extends BaseTreeNode> List<T> buildTreeByRecursive(List<T> treeNodes, Object root) {
        List<T> trees = new ArrayList<T>();
        for (T treeNode : treeNodes) {
            if (root.equals(treeNode.getParentId())) {
                trees.add(findRoutes(treeNode, treeNodes, treeNode.getParentKeys()));
            }
        }
        return trees;
    }

    /**
     * 通过sysMenu集合创建树形路由
     *
     * @param menus
     * @param root
     * @return
     */
    public List<MenuTreeNode> buildMenuTreeByRecursive(List<Menu> menus, int root) {
        List<MenuTreeNode> menuTreeNodes = MenuTreeNodeConverter.INSTANCE.po2dto(menus);
        return TreeUtil.buildTreeByRecursive(menuTreeNodes, root);
    }

    /**
     * 通过sysDept集合创建树形部门
     *
     * @param depts
     * @param root
     * @return
     */
    public List<DeptTreeNode> buildDeptTreeByRecursive(List<Dept> depts, int root) {
        List<DeptTreeNode> deptTreeNodes = DeptTreeNodeConverter.INSTANCE.po2dto(depts);
        return TreeUtil.buildTreeByRecursive(deptTreeNodes, root);
    }

    /**
     * 递归查找子路由
     *
     * @param treeNodes
     * @return
     */
    public <T extends BaseTreeNode> T findRoutes(T treeNode, List<T> treeNodes, String[] parentKeys) {
        for (T it : treeNodes) {
            ArrayList<String> parentKeysList = new ArrayList<>();
            if (treeNode.getId().equals(it.getParentId())) {
                if (treeNode.getChildren() == null) {
                    treeNode.setChildren(new ArrayList<>());
                }
                treeNode.addChildren(findRoutes(it, treeNodes, treeNode.getParentKeys()));
            }
            if (parentKeys != null) {
                parentKeysList.addAll(Arrays.asList(parentKeys));
            }
            parentKeysList.add(treeNode.getParentKey());
            treeNode.setParentKeys(parentKeysList.toArray(new String[parentKeysList.size()]));
        }
        return treeNode;
    }

    /**
     * 通过sysMenu集合创建树形角色菜单
     *
     * @param menus
     * @param root
     * @return
     */
    public List<RoleMenuTreeVo> buildRoleMenusByMenus(List<Menu> menus, int root) {
        List<RoleMenuTreeVo> menuTreeNodes = RoleMenuNodeConverter.INSTANCE.po2dto(menus);
        return TreeUtil.buildRoleMenusByRecursive(menuTreeNodes, root);
    }

    /**
     * 递归获取所有菜单
     *
     * @param treeNodes 所有菜单
     * @param root      父节点
     * @param <T>
     * @return
     */
    public <T extends BaseTreeNode> List<T> buildRoleMenusByRecursive(List<T> treeNodes, Object root) {
        List<T> trees = new ArrayList<T>();
        for (T treeNode : treeNodes) {
            if (root.equals(treeNode.getParentId())) {
                trees.add(findMenus(treeNode, treeNodes));
            }
        }
        return trees;
    }

    /**
     * 递归查找子路由
     *
     * @param treeNodes
     * @return
     */
    public <T extends BaseTreeNode> T findMenus(T treeNode, List<T> treeNodes) {
        for (T it : treeNodes) {
            if (treeNode.getId().equals(it.getParentId()) ) {
                if (treeNode.getChildren() == null) {
                    treeNode.setChildren(new ArrayList<>());
                }
                treeNode.addChildren(findMenus(it, treeNodes));
            }
        }
        return treeNode;
    }


}
