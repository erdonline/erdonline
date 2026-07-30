package com.erdonline.erd.plaza.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.erdonline.common.bean.system.MultiDelete;
import com.erdonline.common.core.api.R;
import com.erdonline.common.log.annotation.MartinLog;
import io.swagger.annotations.ApiOperation;


import com.baomidou.mybatisplus.core.metadata.IPage;
import com.erdonline.erd.plaza.entity.MaterialCategory;
import com.erdonline.erd.plaza.service.MaterialCategoryService;
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

import javax.validation.Valid;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;



/**
 * 素材分类表接口
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
public class MaterialCategoryController{

    @Autowired
    private MaterialCategoryService materialCategoryService;

    @ApiOperation(value = "素材分类表", nickname = "create", notes = "新增素材分类表", tags = {"materialCategory",})
    @RequestMapping(value = "/materialCategory", method = RequestMethod.POST)
    @MartinLog("添加素材分类表")
    public R create(@ApiParam(value = "", required = true) @Valid @RequestBody MaterialCategory materialCategory) {
        return R.ok(materialCategoryService.save(materialCategory));
    }

    @ApiOperation(value = "素材分类表", nickname = "delete", notes = "删除素材分类表", tags = {"materialCategory",})
    @RequestMapping(value = "/materialCategory/{id}", method = RequestMethod.DELETE)
    @MartinLog("删除素材分类表")
    public R delete(@ApiParam(value = "Id", required = true) @PathVariable("id") String id) {
        return R.ok(materialCategoryService.removeById(id));
    }

    @ApiOperation(value = "素材分类表", nickname = "list", notes = "分页查询素材分类表", tags = {"materialCategory",})
    @RequestMapping(value = "/materialCategory", method = RequestMethod.GET)
    @MartinLog("分页查询素材分类表")
    @SneakyThrows
    public R list(@RequestParam Map<String,Object> map) {
        return R.ok(materialCategoryService.getPage(map));
    }

    @ApiOperation(value = "素材分类表", nickname = "multipleDelete", notes = "批量删除素材分类表", tags = {"materialCategory",})
    @RequestMapping(value = "/materialCategory/multiple_delete", method = RequestMethod.DELETE)
    @MartinLog("批量删除素材分类表")
    public R multipleDelete(@ApiParam(value = "", required = true) @Valid @RequestBody MultiDelete materialCategory) {
        return R.ok(materialCategoryService.removeByIds(materialCategory.getKeys()));
    }

    @ApiOperation(value = "素材分类表", nickname = "partialUpdate", notes = "编辑素材分类表", tags = {"materialCategory",})
    @RequestMapping(value = "/materialCategory/{id}", method = RequestMethod.PATCH)
    @MartinLog("编辑素材分类表")
    public R partialUpdate(@ApiParam(value = "Id", required = true) @PathVariable("id") String id, @ApiParam(value = "", required = true) @Valid @RequestBody MaterialCategory materialCategory) {
        return R.ok(materialCategoryService.updateById(materialCategory));
    }

    @ApiOperation(value = "素材分类表", nickname = "read", notes = "获取单个素材分类表", tags = {"materialCategory",})
    @RequestMapping(value = "/materialCategory/{id}", method = RequestMethod.GET)
    @MartinLog("获取单个素材分类表")
    public R read(@ApiParam(value = "Id", required = true) @PathVariable("id") String id) {
        return R.ok(materialCategoryService.getById(id));
    }

    @ApiOperation(value = "素材分类表", nickname = "tree", notes = "获取素材分类表树", tags = {"materialCategory",})
    @RequestMapping(value = "/materialCategory/tree", method = RequestMethod.GET)
    @MartinLog("获取素材分类表树")
    public R tree(@ApiParam(value = "", required = true) MaterialCategory materialCategory) {
        return R.ok(materialCategoryService.tree(materialCategory));
    }

    @ApiOperation(value = "素材分类表", nickname = "update", notes = "修改素材分类表", tags = {"materialCategory",})
    @RequestMapping(value = "/materialCategory/{id}", method = RequestMethod.PUT)
    @MartinLog("编辑素材分类表")
    public R update(@ApiParam(value = "Id", required = true) @PathVariable("id")  String id,  @ApiParam(value = "", required = true) @Valid @RequestBody  MaterialCategory materialCategory) {
        LambdaQueryWrapper<MaterialCategory> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MaterialCategory::getId, id);
        return R.ok(materialCategoryService.update(materialCategory,wrapper));
    }
}

