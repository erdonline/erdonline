package com.erdonline.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.erdonline.common.api.dto.ProjectUserDto;
import com.erdonline.common.api.dto.RoleUserDto;
import com.erdonline.common.bean.system.User;
import com.erdonline.common.bean.system.vo.PrivilegeVO;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * <p>
 * 系统用户 Mapper 接口
 * </p>
 *
 * @author 狮少
 * @date 2019-10-18
 */
public interface UserExtensionMapper extends BaseMapper<User> {

    /**
     * 根据用户id查询用户所有信息
     *
     * @param id
     * @return
     */
    Map currentUser(Object id);

    /**
     * 获取当前用户所有的资源权限信息
     *
     * @return
     */
    List<PrivilegeVO> loadDynamicSecurity(Object id);

    /**
     * 分页获取系统中的用户
     *
     * @param userPage
     * @param projectUserDto
     * @return
     */
    IPage getUsers(Page<User> userPage, @Param(value = "param") ProjectUserDto projectUserDto);

    /**
     * 新用户绑定角色
     *
     * @param userId
     */
    Integer bindRole(String userId);

    /**
     * 获取可以审核sql的用户
     *
     * @param roleIds
     * @return
     */
    List<User> getApprovalUser( @Param(value = "roleIds") List<String> roleIds);

    Map accountBasic(String id);
}
