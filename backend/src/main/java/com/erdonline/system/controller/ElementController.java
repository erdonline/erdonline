package com.erdonline.system.controller;

import cn.hutool.core.collection.CollUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.erdonline.common.bean.system.Element;
import com.erdonline.system.service.ElementService;
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
 * 系统页面元素 前端控制器
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
@RequestMapping("element")
@Api(value = "Element 控制器", tags = "系统页面元素")
public class ElementController {

    @Autowired
    private ElementService elementService;


    /**
     * 添加
     *
     * @param element Element
     * @return R
     */
    @MartinLog("添加系统页面元素")
    @PostMapping
    public R save(@Valid @RequestBody Element element) {
        return R.ok(elementService.save(element));
    }

    /**
     * 删除
     *
     * @param element Element
     * @return R
     */
    @MartinLog("删除系统页面元素")
    @DeleteMapping
    public R removeById(@Valid @RequestBody Element element) {
        return R.ok(elementService.removeById(element.getId()));
    }

    /**
     * 编辑
     *
     * @param element Element
     * @return R
     */
    @MartinLog("编辑系统页面元素")
    @PutMapping
    public R edit(@Valid @RequestBody Element element) {
        return R.ok(elementService.updateById(element));
    }

    /**
     * 通过ID查询
     *
     * @param element Element
     * @return R
     */
    @MartinLog("单个查询系统页面元素")
    @GetMapping
    public R getById(Element element) {
        return R.ok(elementService.getById(element.getId()));
    }

    /**
     * 分页查询
     *
     * @param params 分页以及查询参数
     * @return R
     */
    @SneakyThrows
    @MartinLog("分页查询系统页面元素")
    @GetMapping("/page")
    public R<IPage> getPage(@RequestParam(required = false) Map params) {
        return R.ok(elementService.getPage(params));
    }

    @MartinLog("批量删除系统页面元素")
    @DeleteMapping("/batch")
    public R removeBatch(@RequestBody String ids) {
        List<String> idList = Arrays.stream(ids.split(",")).collect(Collectors.toList());
        if (CollUtil.isEmpty(idList)) {
            return R.failed("ids 不能为空");
        }
        return R.ok(elementService.removeByIds(idList));
    }


}

