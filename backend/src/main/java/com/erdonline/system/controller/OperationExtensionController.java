package com.erdonline.system.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.erdonline.system.service.MenuExtensionService;
import com.erdonline.system.service.OperationService;
import com.erdonline.common.bean.system.Operation;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;


/**
 * <p>
 * 系统操作 前端控制器
 * </p>
 *
 * @author 狮少
 * @date 2019-10-18
 * @since 1.0
 */
@Slf4j
@RestController
@RequestMapping("operation")
@Api(value = "Operation 控制器", tags = "系统操作")
public class OperationExtensionController {

    @Autowired
    private OperationService operationService;

    @Autowired
    private MenuExtensionService menuExtensionService;


    /**
     * 分页查询
     *
     * @param params 分页以及查询参数
     * @return R
     */
    @MartinLog("分页查询系统操作")
    @GetMapping("/unionPage")
    public R getPage(@RequestParam Map params) {
        try {
            IPage<Operation> page = operationService.getPage(params);
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


}

