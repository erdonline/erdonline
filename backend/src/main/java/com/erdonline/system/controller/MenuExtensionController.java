package com.erdonline.system.controller;

import cn.hutool.core.collection.CollUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.erdonline.system.service.MenuExtensionService;
import com.erdonline.system.service.OperationExtensionService;
import com.erdonline.common.bean.system.Menu;
import com.erdonline.common.bean.system.dto.MenuTreeNode;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.common.log.annotation.MartinLog;
import io.swagger.annotations.Api;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/5/8
 * @describtion MenuExtensionController，将需要自定义的url转发，放到这个里面，实现基本的controller可以永远被生成的代码覆盖
 * @since 1.0
 */
@Slf4j
@RestController
@RequestMapping("/menu")
@Api(value = "Menu 控制器", tags = "系统菜单")
public class MenuExtensionController {
    @Autowired
    private MenuExtensionService menuExtensionService;
    @Autowired
    private OperationExtensionService operationExtensionService;


    /**
     * 添加
     *
     * @param menu Menu
     * @return R
     */
    @MartinLog("添加系统菜单")
    @PostMapping("/add")
    @PreAuthorize("hasAuthority('sys_menu_add')")
    public R save(@Valid @RequestBody Menu menu) {
        Integer sort = menu.getSort();
        if (sort == null) {
            Integer max = menuExtensionService.getMaxSort();
            menu.setSort(max + 1);
        }
        return R.ok(menuExtensionService.save(menu));
    }

    /**
     * 分页查询
     *
     * @param params 分页以及查询参数
     * @return R
     */
    @MartinLog("分页查询系统菜单")
    @GetMapping("/unionPage")
    public R getPage(@RequestParam Map params) {
        try {
            IPage<Menu> page = menuExtensionService.getPage(params);
            List<MenuTreeNode> menuTree = menuExtensionService.getAllMenuTree();
            HashMap<String, Object> map = new HashMap<>(2);
            map.put("page", page);
            map.put("menuTree", menuTree);
            return R.ok(map);
        } catch (IllegalAccessException e) {
            log.error("", e);
            return R.failed(ApiErrorCode.FAIL);
        } catch (InstantiationException e) {
            log.error("", e);
            return R.failed(ApiErrorCode.FAIL);
        }
    }

    @MartinLog("获取当前用户拥有的菜单")
    @GetMapping("/getCurrentUserMenusByRoles")
    @PreAuthorize("hasAuthority('sys_menu_tree')")
    public R getCurrentUserMenusByRoles() {
        return menuExtensionService.getCurrentUserMenusByRoles();
    }

    @MartinLog("批量删除系统菜单")
    @PostMapping("/deleteBatch")
    @PreAuthorize("hasAuthority('sys_menu_deleteBatch')")
    public R removeBatch(@RequestBody String ids) {
        List<String> idList = Arrays.stream(ids.split(",")).collect(Collectors.toList());
        if (CollUtil.isEmpty(idList)) {
            return R.failed("id 不能为空");
        }
        return R.ok(menuExtensionService.removeByIds(idList));
    }

    @MartinLog("批量添加系统菜单")
    @PostMapping("/batchSave")
    public R removeBatch(@RequestBody List<Menu> list) {
        return R.ok(menuExtensionService.saveBatch(list));
    }

    @MartinLog("生成菜单CRUD按钮")
    @PostMapping("/generateOperation")
    public R generateOperation(@RequestBody Menu menu) {
        return operationExtensionService.generateOperation(menu);
    }

    @MartinLog("交换两个菜单的排序字段")
    @PostMapping("/exchangeSort")
    public R generateOperation(@RequestBody List<Integer> list) {
        return menuExtensionService.exchangeSort(list);
    }


}
