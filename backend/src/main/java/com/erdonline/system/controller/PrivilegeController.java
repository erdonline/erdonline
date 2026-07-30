package com.erdonline.system.controller;

import cn.hutool.core.collection.CollUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.erdonline.common.bean.system.Privilege;
import com.erdonline.system.service.PrivilegeService;
import com.erdonline.common.core.api.R;
import com.erdonline.common.log.annotation.MartinLog;
import io.swagger.annotations.Api;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;



/**
 * <p>
 * 系统权限 前端控制器
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
@RequestMapping("privilege")
@Api(value = "Privilege 控制器", tags = "系统权限")
public class PrivilegeController {

    @Autowired
    private PrivilegeService privilegeService;


    /**
     * 添加
     *
     * @param privilege Privilege
     * @return R
     */
    @MartinLog("添加系统权限")
    @PostMapping
    public R save(@Valid @RequestBody Privilege privilege) {
        return R.ok(privilegeService.save(privilege));
    }

    /**
     * 删除
     *
     * @param privilege Privilege
     * @return R
     */
    @MartinLog("删除系统权限")
    @DeleteMapping
    public R removeById(@Valid @RequestBody Privilege privilege) {
        return R.ok(privilegeService.removeById(privilege.getId()));
    }

    /**
     * 编辑
     *
     * @param privilege Privilege
     * @return R
     */
    @MartinLog("编辑系统权限")
    @PutMapping
    public R edit(@Valid @RequestBody Privilege privilege) {
        return R.ok(privilegeService.updateById(privilege));
    }

    /**
     * 通过ID查询
     *
     * @param privilege Privilege
     * @return R
     */
    @MartinLog("单个查询系统权限")
    @GetMapping
    public R getById(Privilege privilege) {
        return R.ok(privilegeService.getById(privilege.getId()));
    }

    /**
     * 分页查询
     *
     * @param params 分页以及查询参数
     * @return R
     */
    @SneakyThrows
    @MartinLog("分页查询系统权限")
    @GetMapping("/page")
    public R<IPage> getPage(@RequestParam(required = false) Map params) {
        return R.ok(privilegeService.getPage(params));
    }

    @MartinLog("批量删除系统权限")
    @DeleteMapping("/batch")
    public R removeBatch(@RequestBody String ids) {
        List<String> idList = Arrays.stream(ids.split(",")).collect(Collectors.toList());
        if (CollUtil.isEmpty(idList)) {
            return R.failed("ids 不能为空");
        }
        return R.ok(privilegeService.removeByIds(idList));
    }


}

