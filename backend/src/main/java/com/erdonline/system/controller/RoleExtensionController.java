package com.erdonline.system.controller;

import com.erdonline.system.service.MenuExtensionService;
import com.erdonline.system.service.PrivilegeExtensionService;
import com.erdonline.system.service.RoleExtensionService;
import com.erdonline.common.bean.system.Role;
import com.erdonline.common.bean.system.vo.RoleOperationVo;
import com.erdonline.common.core.api.R;
import io.swagger.annotations.Api;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


/**
 * <p>
 * 系统角色 前端控制器
 * </p>
 *
 * @author 狮少
 * @date 2019-10-18
 * @since 1.0
 */
@Slf4j
@RestController
@RequestMapping("role")
@Api(value = "Role 控制器", tags = "系统角色")
public class RoleExtensionController {

    @Autowired
    private RoleExtensionService roleExtensionService;

    @Autowired
    private MenuExtensionService menuExtensionService;

    @Autowired
    private PrivilegeExtensionService privilegeExtensionService;


    @GetMapping("/getAllMenuByRole")
    public R getAllMenuByRole(Role role) {
        HashMap<String, Object> map = menuExtensionService.getAllMenuByRole(role);
        return R.ok(map);
    }

    @PostMapping("/saveCheckedMenus")
    public R saveCheckedMenus(@RequestBody Map map) {
        Boolean flag = privilegeExtensionService.saveCheckedMenus(map);
        return R.ok(flag);
    }

    @GetMapping("/getOperationByCheckedMenus")
    public R getOperationByCheckedMenus(@RequestParam(required = false) Map map) {
        List<RoleOperationVo> result = roleExtensionService.getOperationByCheckedMenus(map);
        return R.ok(result);
    }

    @PostMapping("/saveCheckedOperations")
    public R<Boolean> saveCheckedOperations(@RequestBody Map map) {
        return privilegeExtensionService.saveCheckedOperations(map);
    }

}

