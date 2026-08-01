package com.erdonline.system.controller;

import cn.hutool.core.collection.CollUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.erdonline.common.bean.system.Dict;
import com.erdonline.system.service.DictService;
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

import jakarta.validation.Valid;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;



/**
 * <p>
 * 系统字典 前端控制器
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
@RequestMapping("dict")
@Api(value = "Dict 控制器", tags = "系统字典")
public class DictController {

    @Autowired
    private DictService dictService;


    /**
     * 添加
     *
     * @param dict Dict
     * @return R
     */
    @MartinLog("添加系统字典")
    @PostMapping
    public R save(@Valid @RequestBody Dict dict) {
        return R.ok(dictService.save(dict));
    }

    /**
     * 删除
     *
     * @param dict Dict
     * @return R
     */
    @MartinLog("删除系统字典")
    @DeleteMapping
    public R removeById(@Valid @RequestBody Dict dict) {
        return R.ok(dictService.removeById(dict.getId()));
    }

    /**
     * 编辑
     *
     * @param dict Dict
     * @return R
     */
    @MartinLog("编辑系统字典")
    @PutMapping
    public R edit(@Valid @RequestBody Dict dict) {
        return R.ok(dictService.updateById(dict));
    }

    /**
     * 通过ID查询
     *
     * @param dict Dict
     * @return R
     */
    @MartinLog("单个查询系统字典")
    @GetMapping
    public R getById(Dict dict) {
        return R.ok(dictService.getById(dict.getId()));
    }

    /**
     * 分页查询
     *
     * @param params 分页以及查询参数
     * @return R
     */
    @SneakyThrows
    @MartinLog("分页查询系统字典")
    @GetMapping("/page")
    public R<IPage> getPage(@RequestParam(required = false) Map params) {
        return R.ok(dictService.getPage(params));
    }

    @MartinLog("批量删除系统字典")
    @DeleteMapping("/batch")
    public R removeBatch(@RequestBody String ids) {
        List<String> idList = Arrays.stream(ids.split(",")).collect(Collectors.toList());
        if (CollUtil.isEmpty(idList)) {
            return R.failed("ids 不能为空");
        }
        return R.ok(dictService.removeByIds(idList));
    }


}

