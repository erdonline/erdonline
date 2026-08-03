package com.erdonline.common.api.system;

import com.erdonline.common.api.dto.ProjectUserDto;
import com.erdonline.common.api.dto.UserDto;
import com.erdonline.common.bean.system.vo.PrivilegeVO;
import com.erdonline.common.bean.system.vo.UserRolePrivilegeVo;
import com.erdonline.common.core.api.R;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;
import java.util.Set;

/**
 * system 模块用户相关远程/本地接口契约。
 */
public interface RemoteSystemUser {
    /**
     * 登录内部加载用户与权限（进程内 UserDetailsService 调用，不暴露 HTTP）。
     *
     * @param username 用户名
     * @return 用户角色权限聚合（含 bcrypt pwd，仅内存传递）
     */
    R<UserRolePrivilegeVo> loadUserByUsername(String username);

    /**
     * 查询所有权限信息
     *
     * @return 权限集合
     */
    @GetMapping("/user/loadDynamicSecurity")
    R<Set<PrivilegeVO>> loadSecurity();

    /**
     * 分页获取系统中的用户
     *
     * @param projectUser 查询条件
     * @return 分页结果
     */
    @PostMapping("/users")
    R users(@RequestBody ProjectUserDto projectUser);

    /**
     * 注册新用户（进程内调用；R-AUTH-06 禁止再挂 HTTP {@code /user/register}）。
     * 产品匿名入口仅 {@code POST /project/group/user/register}。
     *
     * @param userDto 注册信息
     * @return 结果
     */
    R userRegister(UserDto userDto);

    /**
     * 分页获取一批角色的用户名和邮箱
     *
     * @param roleIds 角色 ID 列表
     * @return 用户列表
     */
    @PostMapping("/approval/users")
    R getApprovalUser(@RequestBody List<String> roleIds);

    /**
     * 系统用户总数
     *
     * @return 总数
     */
    @GetMapping("/totalUser")
    R totalUser();
}
