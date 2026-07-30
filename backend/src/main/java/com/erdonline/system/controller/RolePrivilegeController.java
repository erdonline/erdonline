package com.erdonline.system.controller;

import cn.hutool.core.collection.CollUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.erdonline.system.service.RolePrivilegeService;
import com.erdonline.common.bean.system.RolePrivilege;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.common.log.annotation.MartinLog;
import io.swagger.annotations.Api;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


/**
 * <p>
 * 系统角色权限关系 前端控制器
 * </p>
 *
 * @author 狮少
 * @date 2019-10-18
 * @since 1.0
 */
@Slf4j
@RestController
@RequestMapping("role-privilege")
@Api(value = "RolePrivilege 控制器", tags = "系统角色权限关系")
public class RolePrivilegeController {

    @Autowired
    private RolePrivilegeService rolePrivilegeService;


    /**
     * 添加
     *
     * @param rolePrivilege RolePrivilege
     * @return R
     */
    @MartinLog("添加系统角色权限关系")
    @PostMapping("/add")
    @PreAuthorize("hasAuthority('sys_role_privilege_add')")
    public R save(@Valid @RequestBody RolePrivilege rolePrivilege) {
        return R.ok(rolePrivilegeService.save(rolePrivilege));
    }

    /**
     * 删除
     *
     * @param rolePrivilege RolePrivilege
     * @return R
     */
    @MartinLog("删除系统角色权限关系")
    @PostMapping("/delete")
    @PreAuthorize("hasAuthority('sys_role_privilege_del')")
    public R removeById(@Valid @RequestBody RolePrivilege rolePrivilege) {
        return R.ok(rolePrivilegeService.removeById(rolePrivilege.getId()));
    }

    /**
     * 编辑
     *
     * @param rolePrivilege RolePrivilege
     * @return R
     */
    @MartinLog("编辑系统角色权限关系")
    @PostMapping("/update")
    @PreAuthorize("hasAuthority('sys_role_privilege_edit')")
    public R update(@Valid @RequestBody RolePrivilege rolePrivilege) {
        return R.ok(rolePrivilegeService.updateById(rolePrivilege));
    }

    /**
     * 通过ID查询
     *
     * @param rolePrivilege RolePrivilege
     * @return R
     */
    @MartinLog("单个查询系统角色权限关系")
    @PostMapping("/get")
    @PreAuthorize("hasAuthority('sys_role_privilege_get')")
    public R getById(@RequestBody RolePrivilege rolePrivilege) {
        return R.ok(rolePrivilegeService.getById(rolePrivilege.getId()));
    }

    /**
     * 分页查询
     *
     * @param params 分页以及查询参数
     * @return R
     */
    @MartinLog("分页查询系统角色权限关系")
    @PostMapping("/page")
    @PreAuthorize("hasAuthority('sys_role_privilege_page')")
    public R<IPage> getPage(@RequestBody Map params) {
        try {
            return R.ok(rolePrivilegeService.getPage(params));
        } catch (IllegalAccessException e) {
            log.error("", e);
            return R.failed(ApiErrorCode.FAIL);
        } catch (InstantiationException e) {
            log.error("", e);
            return R.failed(ApiErrorCode.FAIL);
        }
    }

    @MartinLog("批量删除系统角色权限关系")
    @PostMapping("/deleteBatch")
    @PreAuthorize("hasAuthority('sys_role_privilege_deleteBatch')")
    public R removeBatch(@RequestBody String ids) {
        List<String> idList = Arrays.stream(ids.split(",")).collect(Collectors.toList());
        if (CollUtil.isEmpty(idList)) {
            return R.failed("id 不能为空");
        }
        return R.ok(rolePrivilegeService.removeByIds(idList));
    }


}

