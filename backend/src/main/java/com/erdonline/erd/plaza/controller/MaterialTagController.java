package com.erdonline.erd.plaza.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.erdonline.common.bean.system.MultiDelete;
import com.erdonline.common.core.api.R;
import com.erdonline.common.log.annotation.MartinLog;
import io.swagger.annotations.ApiOperation;


import com.baomidou.mybatisplus.core.metadata.IPage;
import com.erdonline.erd.plaza.entity.MaterialTag;
import com.erdonline.erd.plaza.service.MaterialTagService;
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
 * 标签表接口
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
public class MaterialTagController{

    @Autowired
    private MaterialTagService materialTagService;

    @ApiOperation(value = "标签表", nickname = "create", notes = "新增标签表", tags = {"materialTag",})
    @RequestMapping(value = "/materialTag", method = RequestMethod.POST)
    @MartinLog("添加标签表")
    public R create(@ApiParam(value = "", required = true) @Valid @RequestBody MaterialTag materialTag) {
        return R.ok(materialTagService.save(materialTag));
    }

    @ApiOperation(value = "标签表", nickname = "delete", notes = "删除标签表", tags = {"materialTag",})
    @RequestMapping(value = "/materialTag/{id}", method = RequestMethod.DELETE)
    @MartinLog("删除标签表")
    public R delete(@ApiParam(value = "Id", required = true) @PathVariable("id") String id) {
        return R.ok(materialTagService.removeById(id));
    }

    @ApiOperation(value = "标签表", nickname = "list", notes = "分页查询标签表", tags = {"materialTag",})
    @RequestMapping(value = "/materialTag", method = RequestMethod.GET)
    @MartinLog("分页查询标签表")
    @SneakyThrows
    public R list(@RequestParam Map<String,Object> map) {
        return R.ok(materialTagService.getPage(map));
    }

    @ApiOperation(value = "标签表", nickname = "multipleDelete", notes = "批量删除标签表", tags = {"materialTag",})
    @RequestMapping(value = "/materialTag/multiple_delete", method = RequestMethod.DELETE)
    @MartinLog("批量删除标签表")
    public R multipleDelete(@ApiParam(value = "", required = true) @Valid @RequestBody MultiDelete materialTag) {
        return R.ok(materialTagService.removeByIds(materialTag.getKeys()));
    }

    @ApiOperation(value = "标签表", nickname = "partialUpdate", notes = "编辑标签表", tags = {"materialTag",})
    @RequestMapping(value = "/materialTag/{id}", method = RequestMethod.PATCH)
    @MartinLog("编辑标签表")
    public R partialUpdate(@ApiParam(value = "Id", required = true) @PathVariable("id") String id, @ApiParam(value = "", required = true) @Valid @RequestBody MaterialTag materialTag) {
        return R.ok(materialTagService.updateById(materialTag));
    }

    @ApiOperation(value = "标签表", nickname = "read", notes = "获取单个标签表", tags = {"materialTag",})
    @RequestMapping(value = "/materialTag/{id}", method = RequestMethod.GET)
    @MartinLog("获取单个标签表")
    public R read(@ApiParam(value = "Id", required = true) @PathVariable("id") String id) {
        return R.ok(materialTagService.getById(id));
    }

    @ApiOperation(value = "标签表", nickname = "tree", notes = "获取标签表树", tags = {"materialTag",})
    @RequestMapping(value = "/materialTag/tree", method = RequestMethod.GET)
    @MartinLog("获取标签表树")
    public R tree(@ApiParam(value = "", required = true) MaterialTag materialTag) {
        return R.ok(materialTagService.tree(materialTag));
    }

    @ApiOperation(value = "标签表", nickname = "update", notes = "修改标签表", tags = {"materialTag",})
    @RequestMapping(value = "/materialTag/{id}", method = RequestMethod.PUT)
    @MartinLog("编辑标签表")
    public R update(@ApiParam(value = "Id", required = true) @PathVariable("id")  String id,  @ApiParam(value = "", required = true) @Valid @RequestBody  MaterialTag materialTag) {
        LambdaQueryWrapper<MaterialTag> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MaterialTag::getId, id);
        return R.ok(materialTagService.update(materialTag,wrapper));
    }
}

