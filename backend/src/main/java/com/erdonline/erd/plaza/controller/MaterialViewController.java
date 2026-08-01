package com.erdonline.erd.plaza.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.erdonline.common.bean.system.MultiDelete;
import com.erdonline.common.core.api.R;
import com.erdonline.common.log.annotation.MartinLog;
import io.swagger.annotations.ApiOperation;


import com.baomidou.mybatisplus.core.metadata.IPage;
import com.erdonline.erd.plaza.entity.MaterialView;
import com.erdonline.erd.plaza.service.MaterialViewService;
import com.erdonline.common.core.api.R;
import com.erdonline.common.log.annotation.MartinLog;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiParam;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;



/**
 * 浏览记录表接口
 *
 * @author 零代科技
 * @version 1.0
 * @date 2024-10-27
 * @describtion
 * @since 1.0
 */
@Slf4j
@RestController
@RequestMapping
public class MaterialViewController{

    @Autowired
    private MaterialViewService materialViewService;

    @ApiOperation(value = "浏览记录表", nickname = "create", notes = "新增浏览记录表", tags = {"materialView",})
    @RequestMapping(value = "/materialView", method = RequestMethod.POST)
    @MartinLog("添加浏览记录表")
    public R create(@ApiParam(value = "", required = true) @Valid @RequestBody MaterialView materialView) {
        return R.ok(materialViewService.save(materialView));
    }

    @ApiOperation(value = "浏览记录表", nickname = "delete", notes = "删除浏览记录表", tags = {"materialView",})
    @RequestMapping(value = "/materialView/{id}", method = RequestMethod.DELETE)
    @MartinLog("删除浏览记录表")
    public R delete(@ApiParam(value = "Id", required = true) @PathVariable("id") String id) {
        return R.ok(materialViewService.removeById(id));
    }

    @ApiOperation(value = "浏览记录表", nickname = "list", notes = "分页查询浏览记录表", tags = {"materialView",})
    @RequestMapping(value = "/materialView", method = RequestMethod.GET)
    @MartinLog("分页查询浏览记录表")
    @SneakyThrows
    public R list(@RequestParam Map<String,Object> map) {
        return R.ok(materialViewService.getPage(map));
    }

    @ApiOperation(value = "浏览记录表", nickname = "multipleDelete", notes = "批量删除浏览记录表", tags = {"materialView",})
    @RequestMapping(value = "/materialView/multiple_delete", method = RequestMethod.DELETE)
    @MartinLog("批量删除浏览记录表")
    public R multipleDelete(@ApiParam(value = "", required = true) @Valid @RequestBody MultiDelete materialView) {
        return R.ok(materialViewService.removeByIds(materialView.getKeys()));
    }

    @ApiOperation(value = "浏览记录表", nickname = "partialUpdate", notes = "编辑浏览记录表", tags = {"materialView",})
    @RequestMapping(value = "/materialView/{id}", method = RequestMethod.PATCH)
    @MartinLog("编辑浏览记录表")
    public R partialUpdate(@ApiParam(value = "Id", required = true) @PathVariable("id") String id, @ApiParam(value = "", required = true) @Valid @RequestBody MaterialView materialView) {
        return R.ok(materialViewService.updateById(materialView));
    }

    @ApiOperation(value = "浏览记录表", nickname = "read", notes = "获取单个浏览记录表", tags = {"materialView",})
    @RequestMapping(value = "/materialView/{id}", method = RequestMethod.GET)
    @MartinLog("获取单个浏览记录表")
    public R read(@ApiParam(value = "Id", required = true) @PathVariable("id") String id) {
        return R.ok(materialViewService.getById(id));
    }

    @ApiOperation(value = "浏览记录表", nickname = "tree", notes = "获取浏览记录表树", tags = {"materialView",})
    @RequestMapping(value = "/materialView/tree", method = RequestMethod.GET)
    @MartinLog("获取浏览记录表树")
    public R tree(@ApiParam(value = "", required = true) MaterialView materialView) {
        return R.ok(materialViewService.tree(materialView));
    }

    @ApiOperation(value = "浏览记录表", nickname = "update", notes = "修改浏览记录表", tags = {"materialView",})
    @RequestMapping(value = "/materialView/{id}", method = RequestMethod.PUT)
    @MartinLog("编辑浏览记录表")
    public R update(@ApiParam(value = "Id", required = true) @PathVariable("id")  String id,  @ApiParam(value = "", required = true) @Valid @RequestBody  MaterialView materialView) {
        LambdaQueryWrapper<MaterialView> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MaterialView::getId, id);
        return R.ok(materialViewService.update(materialView,wrapper));
    }
}

