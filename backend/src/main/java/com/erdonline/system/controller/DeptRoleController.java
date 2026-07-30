package com.erdonline.system.controller;

import cn.hutool.core.collection.CollUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.erdonline.system.service.DeptRoleService;
import com.erdonline.common.bean.system.DeptRole;
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
 * 系统部门角色关系 前端控制器
 * </p>
 *
 * @author 狮少
 * @date 2019-10-18
 * @since 1.0
 */
@Slf4j
@RestController
@RequestMapping("dept-role")
@Api(value = "DeptRole 控制器", tags = "系统部门角色关系")
public class DeptRoleController {

    @Autowired
    private DeptRoleService deptRoleService;


    /**
     * 添加
     *
     * @param deptRole DeptRole
     * @return R
     */
    @MartinLog("添加系统部门角色关系")
    @PostMapping("/add")
    @PreAuthorize("hasAuthority('sys_dept_role_add')")
    public R save(@Valid @RequestBody DeptRole deptRole) {
        return R.ok(deptRoleService.save(deptRole));
    }

    /**
     * 删除
     *
     * @param deptRole DeptRole
     * @return R
     */
    @MartinLog("删除系统部门角色关系")
    @PostMapping("/delete")
    @PreAuthorize("hasAuthority('sys_dept_role_del')")
    public R removeById(@Valid @RequestBody DeptRole deptRole) {
        return R.ok(deptRoleService.removeById(deptRole.getId()));
    }

    /**
     * 编辑
     *
     * @param deptRole DeptRole
     * @return R
     */
    @MartinLog("编辑系统部门角色关系")
    @PostMapping("/update")
    @PreAuthorize("hasAuthority('sys_dept_role_edit')")
    public R update(@Valid @RequestBody DeptRole deptRole) {
        return R.ok(deptRoleService.updateById(deptRole));
    }

    /**
     * 通过ID查询
     *
     * @param deptRole DeptRole
     * @return R
     */
    @MartinLog("单个查询系统部门角色关系")
    @PostMapping("/get")
    @PreAuthorize("hasAuthority('sys_dept_role_get')")
    public R getById(@RequestBody DeptRole deptRole) {
        return R.ok(deptRoleService.getById(deptRole.getId()));
    }

    /**
     * 分页查询
     *
     * @param params 分页以及查询参数
     * @return R
     */
    @MartinLog("分页查询系统部门角色关系")
    @PostMapping("/page")
    @PreAuthorize("hasAuthority('sys_dept_role_page')")
    public R<IPage> getPage(@RequestBody Map params) {
        try {
            return R.ok(deptRoleService.getPage(params));
        } catch (IllegalAccessException e) {
            log.error("", e);
            return R.failed(ApiErrorCode.FAIL);
        } catch (InstantiationException e) {
            log.error("", e);
            return R.failed(ApiErrorCode.FAIL);
        }
    }

    @MartinLog("批量删除系统部门角色关系")
    @PostMapping("/deleteBatch")
    @PreAuthorize("hasAuthority('sys_dept_role_deleteBatch')")
    public R removeBatch(@RequestBody String ids) {
        List<String> idList = Arrays.stream(ids.split(",")).collect(Collectors.toList());
        if (CollUtil.isEmpty(idList)) {
            return R.failed("id 不能为空");
        }
        return R.ok(deptRoleService.removeByIds(idList));
    }


}

