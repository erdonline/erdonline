package com.erdonline.system.service;

import com.erdonline.common.bean.system.Privilege;
import com.erdonline.common.bean.system.vo.PrivilegeVO;
import com.erdonline.common.core.api.R;
import com.erdonline.common.data.mybatis.service.MartinService;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;

/**
 * <p>
 * 系统权限 服务类
 * </p>
 *
 * @author 狮少
 * @date 2019-10-18
 */
@Transactional(rollbackFor = Exception.class)
public interface PrivilegeExtensionService extends MartinService<Privilege> {
    /**
     * 通过角色获取权限
     *
     * @param roleList
     * @return
     */
    Set<PrivilegeVO> getPrivilegeByRoles(Set<String> roleList);

    /**
     * 获取全部权限
     *
     * @param roleList
     * @return
     */
    Set<PrivilegeVO> getAllPrivilege();

    /**
     * 更新角色的菜单信息，先删除原来的，再插入新的
     *
     * @param map
     * @return
     */
    Boolean saveCheckedMenus(Map map);

    /**
     * 更新角色的按钮信息，先删除原来的，再插入新的
     *
     * @param map
     * @return
     */
    R saveCheckedOperations(Map map);

    /**
     * 初始化Admin角色权限
     * @param roleId
     */
    void initERDAdminPermission(String roleId);

    /**
     * 初始化管理员角色权限
     * @param roleId
     */
    void initERDManagerPermission(String roleId);

    /**
     * 初始化普通角色权限
     * @param roleId
     */
    void initERDCommonPermission(String roleId);
}
