package com.erdonline.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.erdonline.common.bean.system.Privilege;
import com.erdonline.common.bean.system.vo.PrivilegeVO;
import org.apache.ibatis.annotations.Param;

import java.util.Map;
import java.util.Set;

/**
 * <p>
 * 系统权限 Mapper 接口
 * </p>
 *
 * @author 狮少
 * @date 2019-10-18
 */
public interface PrivilegeExtensionMapper extends BaseMapper<Privilege> {
    /**
     * 通过角色获取权限
     *
     * @param roleList
     * @return
     */
    Set<PrivilegeVO> getPrivilegeByRoles(@Param("roleList") Set<String> roleList);

    /**
     * 先删除原来的角色菜单
     *
     * @param map
     * @return
     */
    Boolean deleteOldMenus(Map map);

    /**
     * 插入角色新菜单信息
     *
     * @param map
     * @return
     */
    Boolean saveCheckedMenus(Map map);


    /**
     * 先删除原来的角色按钮
     *
     * @param map
     * @return
     */
    Boolean deleteOldOperations(Map map);

    /**
     * 插入角色新按钮信息
     *
     * @param map
     * @return
     */
    Boolean saveCheckedOperations(Map map);

    /**
     * 初始化admin权限
     *
     * @param roleId
     */
    void initERDAdminPermission(String roleId);

    /**
     * 初始化管理员权限
     *
     * @param roleId
     */
    void initERDManagerPermission(String roleId);

    /**
     * 初始化普通权限
     *
     * @param roleId
     */
    void initERDCommonPermission(String roleId);
}
