package com.erdonline.system.controller;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.erdonline.system.dto.UserDto;
import com.erdonline.system.service.RoleExtensionService;
import com.erdonline.system.service.UserExtensionService;
import com.erdonline.system.service.UserRoleService;
import com.erdonline.system.vo.RoleCheckbox;
import com.erdonline.common.bean.system.User;
import com.erdonline.common.bean.system.UserRole;
import com.erdonline.common.core.api.R;
import com.erdonline.common.log.annotation.MartinLog;
import com.erdonline.common.security.util.SecurityContextUtil;
import io.swagger.annotations.Api;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


/**
 * <p>
 * 系统用户 前端控制器
 * </p>
 *
 * @author 狮少
 * @date 2019-10-18
 * @since 1.0
 */
@Slf4j
@RestController
@RequestMapping("user")
@Api(value = "User 控制器", tags = "系统用户")
public class UserExtensionController {

    @Autowired
    private UserExtensionService userExtensionService;

    @Autowired
    private UserRoleService userRoleService;

    @Autowired
    private RoleExtensionService roleExtensionService;

    @Autowired
    private PasswordEncoder passwordEncoder;


    /**
     * 添加
     *
     * @param user User
     * @return R
     */
    @MartinLog("添加系统用户")
    @PostMapping("/add")
    @PreAuthorize("hasAuthority('sys_user_add')")
    public R save(@Valid @RequestBody User user) {
        String pwd = user.getPwd();
        if (StrUtil.isNotBlank(pwd)) {
            user.setPwd(passwordEncoder.encode(pwd));
        }
        return R.ok(userExtensionService.save(user));
    }


    /**
     * 编辑
     *
     * @param user User
     * @return R
     */
    @MartinLog("编辑系统用户")
    @PostMapping("/update")
    @PreAuthorize("hasAuthority('sys_user_edit')")
    public R update(@Valid @RequestBody User user) {
        String pwd = user.getPwd();
        if (StrUtil.isNotBlank(pwd)) {
            user.setPwd(passwordEncoder.encode(pwd));
        }
        return R.ok(userExtensionService.updateById(user));
    }


    @GetMapping("/authorities")
    public R<Map> getAuthority() {
        HashMap<String, Object> map = new HashMap<>(3);
        try {
            map.put("status", "ok");
            map.put("type", "");
            map.put("currentAuthority", SecurityContextUtil.getAuthorities());
        } catch (Exception e) {
            map.put("status", "error");
            log.error("", e.getMessage());
        }
        return R.ok(map);
    }

    @GetMapping("/getAllRoles")
    public R<List<RoleCheckbox>> getAllRoles(@RequestParam(required = false) Map params) {
        List<RoleCheckbox> roles = roleExtensionService.getAllRoles();
        List<RoleCheckbox> selectRoles = roleExtensionService.getSelectRoles(params);
        List<RoleCheckbox> roleCheckboxes = roles.stream().map(roleCheckbox -> {
            boolean anyMatch = selectRoles.stream().anyMatch(roleCheckbox1 -> roleCheckbox1.getValue().compareTo(roleCheckbox.getValue()) == 0);
            if (anyMatch) {
                roleCheckbox.setChecked(true);
            }
            return roleCheckbox;
        }).collect(Collectors.toList());
        return R.ok(roleCheckboxes);
    }

    @PostMapping("/addUserRole")
    public R addUserRole(@Valid @RequestBody UserRole userRole) {
        return R.ok(userRoleService.save(userRole));
    }

    @PostMapping("/deleteUserRole")
    public R deleteUserRole(@Valid @RequestBody UserRole userRole) {
        return R.ok(userRoleService.remove(Wrappers.query(userRole)));
    }

    @GetMapping("/currentUser")
    public R currentUser() {
        return userExtensionService.currentUser();
    }

    @GetMapping("/settings/basic")
    public R accountBasic() {
        return userExtensionService.accountBasic();
    }

    @PostMapping("/settings/update")
    public R accountUpdate(@Valid @RequestBody UserDto userDto) {
        return userExtensionService.accountUpdate(userDto);
    }

    @GetMapping("/test1")
    public R test1() {
        return R.ok("test1");
    }

}

