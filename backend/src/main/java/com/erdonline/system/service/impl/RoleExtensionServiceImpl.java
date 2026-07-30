package com.erdonline.system.service.impl;

import cn.hutool.core.collection.CollUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.erdonline.system.mapper.RoleExtensionMapper;
import com.erdonline.system.service.MenuExtensionService;
import com.erdonline.system.service.PrivilegeExtensionService;
import com.erdonline.system.service.RoleExtensionService;
import com.erdonline.system.service.UserRoleService;
import com.erdonline.system.vo.RoleCheckbox;
import com.erdonline.common.api.dto.ProjectUserDto;
import com.erdonline.common.api.dto.RoleUserDto;
import com.erdonline.common.bean.system.Role;
import com.erdonline.common.bean.system.User;
import com.erdonline.common.bean.system.UserRole;
import com.erdonline.common.bean.system.vo.MenuOperationVo;
import com.erdonline.common.bean.system.vo.RoleOperationVo;
import com.erdonline.common.core.api.R;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import com.erdonline.common.security.util.SecurityContextUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * <p>
 * 系统角色 服务实现类
 * </p>
 *
 * @author 狮少
 * @date 2019-10-18
 */
@Slf4j
@Service
@RestController
public class RoleExtensionServiceImpl extends MartinServiceImpl<RoleExtensionMapper, Role> implements RoleExtensionService {
    @Autowired
    private UserRoleService userRoleService;

    @Autowired
    private MenuExtensionService menuExtensionService;

    @Autowired
    private PrivilegeExtensionService privilegeExtensionService;

    @Override
    protected void setEntity() {
        this.clz = Role.class;
    }

    @Override
    public List<RoleCheckbox> getAllRoles() {
        return baseMapper.getAllRoles();
    }

    @Override
    public List<RoleCheckbox> getSelectRoles(Map map) {
        return baseMapper.getSelectRoles(map);
    }

    @Override
    public List<RoleOperationVo> getOperationByCheckedMenus(Map map) {
        //获取所选菜单的所有按钮
        List<MenuOperationVo> allOperationsByMenus = baseMapper.getALlOperationsByMenus(map);
        //获取所选菜单的已选按钮
        List<MenuOperationVo> checkedOperationsByMenus = baseMapper.getCheckedOperationsByMenus(map);

        return getRoleOperationVos(allOperationsByMenus, checkedOperationsByMenus);
    }


    @Override
    public R<List<Role>> register(List<Role> roles) {
        if (CollUtil.isEmpty(roles)) {
            return R.failed("注册角色失败，参数不能为空");
        }
        log.info("role:{}", roles);
        this.saveBatch(roles);
        List<String> roleCodes = roles.stream().map(m -> {
            return m.getRoleCode();
        }).collect(Collectors.toList());
        LambdaQueryWrapper<Role> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.in(Role::getRoleCode, roleCodes);
        List<Role> results = this.list(queryWrapper);
        log.info("results: {}", results);
        //初始化角色权限
        results.stream().forEach(f -> {
            String roleCode = f.getRoleCode();
            String roleId = f.getId();
            if (roleCode.contains("_0")) {
                privilegeExtensionService.initERDAdminPermission(roleId);
            } else if (roleCode.contains("_1")) {
                privilegeExtensionService.initERDManagerPermission(roleId);
            } else if (roleCode.contains("_2")) {
                privilegeExtensionService.initERDCommonPermission(roleId);
            }
        });
        //当前用户绑定admin角色
        Role admin = results.stream().filter(f -> f.getRoleCode().contains("_0")).findFirst().get();
        UserRole userRole = new UserRole();
        userRole.setRoleId(admin.getId());
        String userId = SecurityContextUtil.getAccessUser().getId();
        userRole.setUserId(userId);
        userRoleService.save(userRole);
        return R.ok(results);
    }

    @Override
    public R roleUsers(ProjectUserDto projectUserDto) {
        log.info("projectUserDto: {}", projectUserDto);
        Page<User> userPage = new Page<>(projectUserDto.getCurrent(), projectUserDto.getPageSize());
        IPage result = this.baseMapper.getUsersByRoleId(userPage, projectUserDto);
        return R.ok(result);
    }

    @Override
    public R saveRoleUsers(RoleUserDto roleUserDto) {
        log.info("roleUserDto: {}", roleUserDto);
        this.baseMapper.saveRoleUsers(roleUserDto);
        return R.ok("保存成功");
    }

    @Override
    public R delRoleUsers(RoleUserDto roleUserDto) {
        log.info("roleUserDto: {}", roleUserDto);
        LambdaQueryWrapper<UserRole> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserRole::getRoleId, roleUserDto.getRoleId());
        wrapper.eq(UserRole::getUserId, roleUserDto.getUserIds().get(0));
        return R.ok(userRoleService.remove(wrapper));
    }

    @Override
    public R rolePermission(String roleId) {
        log.info("roleId: {}", roleId);
        //获取ERD团队全部权限项
        List<MenuOperationVo> erdAllGroupPermission = this.baseMapper.getERDGroupAllPermission(roleId);
        log.info("erdAllGroupPermission: {}", erdAllGroupPermission);
        //获取ERD某个角色权限
        List<MenuOperationVo> erdGroupRolePermission = this.baseMapper.getERDGroupRolePermission(roleId);
        log.info("erdGroupRolePermission: {}", erdGroupRolePermission);
        List<RoleOperationVo> returnList = getRoleOperationVos(erdAllGroupPermission, erdGroupRolePermission);

        return R.ok(returnList);
    }

    @Override
    public R saveCheckedOperations(Map map) {
        log.info("map: {}", map);
        return privilegeExtensionService.saveCheckedOperations(map);
    }

    @Override
    public R roleCheckedPermission(String roleId) {
        //获取ERD某个角色权限
        List<MenuOperationVo> erdGroupRolePermission = this.baseMapper.getERDGroupRolePermission(roleId);
        log.info("erdGroupRolePermission: {}", erdGroupRolePermission.size());
        if (CollUtil.isEmpty(erdGroupRolePermission)) {
            return R.failed("当前用户暂无授权");
        }
        ArrayList<Object> defaultValue = new ArrayList<>();
        erdGroupRolePermission.stream().forEach((checkedOperation) -> {
            defaultValue.add(checkedOperation.getCode());
        });
        return R.ok(defaultValue);
    }

    /**
     * 分组全部权限、已授权权限
     *
     * @param allMenu
     * @param permissionOperate
     * @return
     */
    private List<RoleOperationVo> getRoleOperationVos(List<MenuOperationVo> allMenu, List<MenuOperationVo> permissionOperate) {
        //使用LinkedHashMap保证从数据库查出的顺序不变，默认的构造函数是HashMap，无法保证顺序
        Map<String, List<MenuOperationVo>> groupMenus = allMenu.stream().collect(Collectors.groupingBy(MenuOperationVo::getMenuName, LinkedHashMap::new, Collectors.toList()));
        List<RoleOperationVo> returnList = new ArrayList<>();

        groupMenus.forEach((k, v) -> {
            RoleOperationVo roleOperationVo = new RoleOperationVo();
            List<String> defaultValue = new ArrayList<>();
            List operations = new ArrayList<>();
            v.stream().forEach((allOperation) -> {
                        permissionOperate.stream().forEach((checkedOperation) -> {
                            if (allOperation.getValue().equals(checkedOperation.getValue())) {
                                defaultValue.add(checkedOperation.getValue());
                            }
                        });
                        RoleOperationVo.OperationVo operationVo = roleOperationVo.new OperationVo();
                        operationVo.setName(allOperation.getName());
                        operationVo.setValue(allOperation.getValue());
                        operations.add(operationVo);
                    }
            );
            roleOperationVo.setMenuName(k);
            roleOperationVo.setMenuId("");
            roleOperationVo.setDefaultValue(defaultValue);
            roleOperationVo.setOperations(operations);
            returnList.add(roleOperationVo);
        });
        return returnList;
    }
}
