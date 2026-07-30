package com.erdonline.system.controller;

import cn.hutool.core.collection.CollUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.erdonline.common.bean.system.Code;
import com.erdonline.system.service.CodeService;
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
 * 系统代码生成表 前端控制器
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
@RequestMapping("code")
@Api(value = "Code 控制器", tags = "系统代码生成表")
public class CodeController {

    @Autowired
    private CodeService codeService;


    /**
     * 添加
     *
     * @param code Code
     * @return R
     */
    @MartinLog("添加系统代码生成表")
    @PostMapping
    public R save(@Valid @RequestBody Code code) {
        return R.ok(codeService.save(code));
    }

    /**
     * 删除
     *
     * @param code Code
     * @return R
     */
    @MartinLog("删除系统代码生成表")
    @DeleteMapping
    public R removeById(@Valid @RequestBody Code code) {
        return R.ok(codeService.removeById(code.getId()));
    }

    /**
     * 编辑
     *
     * @param code Code
     * @return R
     */
    @MartinLog("编辑系统代码生成表")
    @PutMapping
    public R edit(@Valid @RequestBody Code code) {
        return R.ok(codeService.updateById(code));
    }

    /**
     * 通过ID查询
     *
     * @param code Code
     * @return R
     */
    @MartinLog("单个查询系统代码生成表")
    @GetMapping
    public R getById(Code code) {
        return R.ok(codeService.getById(code.getId()));
    }

    /**
     * 分页查询
     *
     * @param params 分页以及查询参数
     * @return R
     */
    @SneakyThrows
    @MartinLog("分页查询系统代码生成表")
    @GetMapping("/page")
    public R<IPage> getPage(@RequestParam(required = false) Map params) {
        return R.ok(codeService.getPage(params));
    }

    @MartinLog("批量删除系统代码生成表")
    @DeleteMapping("/batch")
    public R removeBatch(@RequestBody String ids) {
        List<String> idList = Arrays.stream(ids.split(",")).collect(Collectors.toList());
        if (CollUtil.isEmpty(idList)) {
            return R.failed("ids 不能为空");
        }
        return R.ok(codeService.removeByIds(idList));
    }


}

