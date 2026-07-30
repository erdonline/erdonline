package com.erdonline.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.erdonline.system.vo.RoleCheckbox;
import com.erdonline.common.api.dto.ProjectUserDto;
import com.erdonline.common.api.dto.RoleUserDto;
import com.erdonline.common.bean.system.Role;
import com.erdonline.common.bean.system.User;
import com.erdonline.common.bean.system.vo.MenuOperationVo;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * <p>
 * 系统角色 Mapper 接口
 * </p>
 *
 * @author 狮少
 * @date 2019-10-18
 */
public interface RoleExtensionMapper extends BaseMapper<Role> {

    /**
     * 获取系统所有角色
     *
     * @return
     */
    List<RoleCheckbox> getAllRoles();

    /**
     * 获取当前用户已分配角色
     *
     * @param user
     * @return
     */
    List<RoleCheckbox> getSelectRoles(Map user);

    /**
     * 获取所选菜单的所有按钮
     *
     * @param map
     * @return
     */
    List<MenuOperationVo> getALlOperationsByMenus(Map map);

    /**
     * 获取所选菜单的已选按钮
     *
     * @param map
     * @return
     */
    List<MenuOperationVo> getCheckedOperationsByMenus(Map map);

    /**
     * 获取角色下的全部用户
     *
     * @param param
     * @return
     */
    IPage<User> getUsersByRoleId(Page page, @Param(value = "param") ProjectUserDto param);

    /**
     * 保存角色下的用户
     *
     * @param roleUserDto
     */
    void saveRoleUsers(RoleUserDto roleUserDto);

    /**
     * 获取角色下ERD权限
     *
     * @param roleId
     * @return
     */
    List<MenuOperationVo> getERDGroupAllPermission(String roleId);

    /**
     * 获取ERD角色已授予权限
     *
     * @param roleId
     * @return
     */
    List<MenuOperationVo> getERDGroupRolePermission(String roleId);
}
