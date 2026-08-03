package com.erdonline.system.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.collection.CollectionUtil;
import cn.hutool.core.convert.Convert;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.erdonline.system.mapper.UserExtensionMapper;
import com.erdonline.system.service.PrivilegeExtensionService;
import com.erdonline.system.service.UserExtensionService;
import com.erdonline.system.service.UserRoleService;
import com.erdonline.common.api.dto.ProjectUserDto;
import com.erdonline.common.api.dto.UserDto;
import com.erdonline.common.bean.system.User;
import com.erdonline.common.bean.system.UserRole;
import com.erdonline.common.bean.system.vo.PrivilegeVO;
import com.erdonline.common.bean.system.vo.UserRolePrivilegeVo;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.config.ErdSecurityProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * <p>
 * 系统用户 服务实现类
 * </p>
 *
 * @author 狮少
 * @date 2019-10-18
 * <p>
 */
@RestController
@Service
@Slf4j
public class UserExtensionServiceImpl extends MartinServiceImpl<UserExtensionMapper, User> implements UserExtensionService {
    @Autowired
    private PrivilegeExtensionService privilegeExtensionService;
    @Autowired
    private UserRoleService userRoleService;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private ErdSecurityProperties erdSecurityProperties;

    @Override
    protected void setEntity() {
        this.clz = User.class;
    }

    @Override
    public R currentUser() {
        MartinUser user = SecurityContextUtil.getAccessUser();
        Map data = this.baseMapper.currentUser(user.getId());
        data.put("access", SecurityContextUtil.getAuthorities());
        return R.ok(data);
    }

    @Override
    public R accountBasic() {
        MartinUser user = SecurityContextUtil.getAccessUser();
        Map data = this.baseMapper.accountBasic(user.getId());
        return R.ok(data);
    }

    @Override
    public R accountUpdate(com.erdonline.system.dto.UserDto userDto) {
        log.info("userDto: {}", userDto);
        if (StrUtil.isNotBlank(userDto.getPwd())) {
            String encodePwd = passwordEncoder.encode(userDto.getPwd());
            userDto.setPwd(encodePwd);
        }
        String userId = SecurityContextUtil.getAccessUser().getId();
        User user = new User();
        BeanUtil.copyProperties(userDto, user);
        LambdaUpdateWrapper<User> wrapper = new LambdaUpdateWrapper();
        wrapper.eq(User::getId, userId);
        this.baseMapper.update(user, wrapper);
        return R.ok("更新成功");
    }

    @Override
    public R<UserRolePrivilegeVo> loadUserByUsername(String username) {
        UserRolePrivilegeVo userRolePrivilegeVo = new UserRolePrivilegeVo();
        User user = this.getOne(Wrappers.<User>query().lambda().eq(User::getUsername, username));
        log.debug("{}", Convert.toStr(user));
        if (null == user) {
            return R.failed(ApiErrorCode.USER_NOT_FOUND);
        }
        userRolePrivilegeVo.setUser(user);
        List<UserRole> roleList = userRoleService.list(Wrappers.<UserRole>query().lambda().eq(UserRole::getUserId, user.getId()));
        if (CollectionUtil.isEmpty(roleList)) {
            log.error("{}", R.failed(ApiErrorCode.ROLE_NOT_FOUND));
            return R.failed(ApiErrorCode.ROLE_NOT_FOUND);
        }
        Map<String, List<UserRole>> roles = roleList.stream().collect(Collectors.groupingBy(UserRole::getRoleId));
        log.info("roles: {}", roles);
        // 单体化后为进程内本地调用；复制为 HashSet，避免 keySet 视图带来的序列化问题
        Set<String> roleIds = new java.util.HashSet<>(roles.keySet());
        log.info("roleIds: {}", roleIds);
        userRolePrivilegeVo.setRoles(roleIds);
        Set<PrivilegeVO> authoritySet = privilegeExtensionService.getPrivilegeByRoles(roleIds);
        if (CollectionUtil.isEmpty(authoritySet)) {
            log.error("{}", R.failed(ApiErrorCode.PRIVILEGE_NOT_FOUND));
            return R.failed(ApiErrorCode.PRIVILEGE_NOT_FOUND);
        }
        userRolePrivilegeVo.setRestfulPrivilege(authoritySet);
        userRolePrivilegeVo.setAuthoritySet(authoritySet.stream().map((vo) -> vo.getAuthority()).collect(Collectors.toSet()));
        return R.ok(userRolePrivilegeVo);
    }

    @Override
    public R<Set<PrivilegeVO>> loadSecurity() {
        return R.ok(privilegeExtensionService.getAllPrivilege());
    }

    @Override
    public R users(ProjectUserDto projectUserDto) {
        log.info("projectUserDto: {}", projectUserDto);
        if (StrUtil.isBlank(projectUserDto.getRoleId())) {
            log.error("roleId 为空");
            return R.failed("roleId 为空");
        }
        log.info("projectUserDto: {}", projectUserDto);
        Page<User> userPage = new Page<>(projectUserDto.getCurrent(), projectUserDto.getPageSize());
        IPage result = this.baseMapper.getUsers(userPage, projectUserDto);
        return R.ok(result);
    }

    @Override
    public R userRegister(@Validated UserDto userDto) {
        // R-AUTH-06：prod/默认关闭开放注册；dev=true 保本地/E2E
        if (!erdSecurityProperties.isAllowOpenRegister()) {
            log.warn("rejected open register (erd.security.allow-open-register=false)");
            return R.failed(ApiErrorCode.FORBIDDEN.getCode(), "开放注册已关闭，请联系管理员");
        }
        log.info("userDto: {}", userDto);
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.or().eq(User::getUsername, userDto.getUsername());
        wrapper.or().eq(User::getEmail, userDto.getEmail());
        wrapper.or().eq(User::getPhone, userDto.getPhone());
        List<User> userList = this.baseMapper.selectList(wrapper);
        log.info("existUser: {}", userList);
        if (CollUtil.isEmpty(userList)) {
            User user = new User();
            BeanUtil.copyProperties(userDto, user);
            user.setPwd(passwordEncoder.encode(userDto.getPwd()));
            // JWT claim 不允许 null；缺省部门与种子账号一致，否则注册后登录被误报为账密错误
            if (StrUtil.isBlank(user.getDeptId())) {
                user.setDeptId("1");
            }
            this.baseMapper.insert(user);
            Integer count = this.baseMapper.bindRole(user.getId());
            log.info("count: {}", count);
            return R.ok("用户注册成功!");
        } else {
            return R.failed(StrUtil.format("用户名「{}」或邮箱「{}」或手机号「{}」已经存在", userDto.getUsername(), userDto.getEmail(), userDto.getPhone()));
        }
    }

    @Override
    public R getApprovalUser(List<String> roleIds) {
        log.info("roleIds: {}", roleIds);
        if (CollUtil.isEmpty(roleIds)) {
            log.error("roleIds 为空");
            return R.failed("roleIds 为空");
        }
        List<User> result = this.baseMapper.getApprovalUser(roleIds);
        return R.ok(result);
    }

    @Override
    public R totalUser() {
        Long total = this.baseMapper.selectCount(new QueryWrapper<>());
        // 单体化后为进程内本地调用（原 Feign 经 JSON 序列化会自动适配数字类型），
        // 消费方 PersonLoginCountRight 期望 Integer，此处显式转换避免 Long->Integer 强转异常
        return R.ok(total == null ? 0 : total.intValue());
    }

}
