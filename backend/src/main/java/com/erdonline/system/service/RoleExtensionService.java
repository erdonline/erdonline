package com.erdonline.system.service;

import com.erdonline.system.vo.RoleCheckbox;
import com.erdonline.common.api.system.RemoteSystemRole;
import com.erdonline.common.bean.system.Role;
import com.erdonline.common.bean.system.vo.RoleOperationVo;
import com.erdonline.common.data.mybatis.service.MartinService;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * <p>
 * 系统角色 服务类
 * </p>
 *
 * @author 狮少
 * @date 2019-10-18
 */
@Transactional(rollbackFor = Exception.class)
public interface RoleExtensionService extends MartinService<Role>, RemoteSystemRole {

    /**
     * 获取系统全部角色
     *
     * @return
     */
    List<RoleCheckbox> getAllRoles();

    /**
     * 获取当前用户已分配角色
     *
     * @param user
     * @param id
     * @return
     */
    List<RoleCheckbox> getSelectRoles(Map map);

    /**
     * 根据选中角色的菜单信息，获取按钮信息
     *
     * @param map
     * @return
     */
    List<RoleOperationVo> getOperationByCheckedMenus(Map map);
}
