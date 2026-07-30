package com.erdonline.system.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.erdonline.system.service.DeptExtensionService;
import com.erdonline.common.bean.system.Dept;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.common.log.annotation.MartinLog;
import io.swagger.annotations.Api;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;


/**
 * <p>
 * 系统部门 前端控制器
 * </p>
 *
 * @author 狮少
 * @version 1.0
 * @date 2021-05-08
 * @describtion
 * @since 1.0
 */
@Slf4j
@RestController
@RequestMapping("dept")
@Api(value = "Dept 控制器", tags = "系统部门")
public class DeptExtensionController {

    @Autowired
    private DeptExtensionService deptExtensionService;

    /**
     * 分页查询
     *
     * @param params 分页以及查询参数
     * @return R
     */
    @SneakyThrows
    @MartinLog("分页查询系统部门")
    @GetMapping("/unionPage")
    public R getPage(@RequestParam Map params) {
        try {
            IPage<Dept> page = deptExtensionService.getPage(params);
            List menuTree = deptExtensionService.getAllDptTree();
            HashMap<String, Object> map = new HashMap<>(2);
            map.put("page", page);
            map.put("deptTree", menuTree);
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

