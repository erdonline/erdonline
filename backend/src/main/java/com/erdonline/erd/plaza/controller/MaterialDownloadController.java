package com.erdonline.erd.plaza.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.erdonline.common.bean.system.MultiDelete;
import com.erdonline.common.core.api.R;
import com.erdonline.common.log.annotation.MartinLog;
import io.swagger.annotations.ApiOperation;


import com.baomidou.mybatisplus.core.metadata.IPage;
import com.erdonline.erd.plaza.entity.MaterialDownload;
import com.erdonline.erd.plaza.service.MaterialDownloadService;
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
 * 下载记录表接口
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
public class MaterialDownloadController{

    @Autowired
    private MaterialDownloadService materialDownloadService;

    @ApiOperation(value = "下载记录表", nickname = "create", notes = "新增下载记录表", tags = {"materialDownload",})
    @RequestMapping(value = "/materialDownload", method = RequestMethod.POST)
    @MartinLog("添加下载记录表")
    public R create(@ApiParam(value = "", required = true) @Valid @RequestBody MaterialDownload materialDownload) {
        return R.ok(materialDownloadService.save(materialDownload));
    }

    @ApiOperation(value = "下载记录表", nickname = "delete", notes = "删除下载记录表", tags = {"materialDownload",})
    @RequestMapping(value = "/materialDownload/{id}", method = RequestMethod.DELETE)
    @MartinLog("删除下载记录表")
    public R delete(@ApiParam(value = "Id", required = true) @PathVariable("id") String id) {
        return R.ok(materialDownloadService.removeById(id));
    }

    @ApiOperation(value = "下载记录表", nickname = "list", notes = "分页查询下载记录表", tags = {"materialDownload",})
    @RequestMapping(value = "/materialDownload", method = RequestMethod.GET)
    @MartinLog("分页查询下载记录表")
    @SneakyThrows
    public R list(@RequestParam Map<String,Object> map) {
        return R.ok(materialDownloadService.getPage(map));
    }

    @ApiOperation(value = "下载记录表", nickname = "multipleDelete", notes = "批量删除下载记录表", tags = {"materialDownload",})
    @RequestMapping(value = "/materialDownload/multiple_delete", method = RequestMethod.DELETE)
    @MartinLog("批量删除下载记录表")
    public R multipleDelete(@ApiParam(value = "", required = true) @Valid @RequestBody MultiDelete materialDownload) {
        return R.ok(materialDownloadService.removeByIds(materialDownload.getKeys()));
    }

    @ApiOperation(value = "下载记录表", nickname = "partialUpdate", notes = "编辑下载记录表", tags = {"materialDownload",})
    @RequestMapping(value = "/materialDownload/{id}", method = RequestMethod.PATCH)
    @MartinLog("编辑下载记录表")
    public R partialUpdate(@ApiParam(value = "Id", required = true) @PathVariable("id") String id, @ApiParam(value = "", required = true) @Valid @RequestBody MaterialDownload materialDownload) {
        return R.ok(materialDownloadService.updateById(materialDownload));
    }

    @ApiOperation(value = "下载记录表", nickname = "read", notes = "获取单个下载记录表", tags = {"materialDownload",})
    @RequestMapping(value = "/materialDownload/{id}", method = RequestMethod.GET)
    @MartinLog("获取单个下载记录表")
    public R read(@ApiParam(value = "Id", required = true) @PathVariable("id") String id) {
        return R.ok(materialDownloadService.getById(id));
    }

    @ApiOperation(value = "下载记录表", nickname = "tree", notes = "获取下载记录表树", tags = {"materialDownload",})
    @RequestMapping(value = "/materialDownload/tree", method = RequestMethod.GET)
    @MartinLog("获取下载记录表树")
    public R tree(@ApiParam(value = "", required = true) MaterialDownload materialDownload) {
        return R.ok(materialDownloadService.tree(materialDownload));
    }

    @ApiOperation(value = "下载记录表", nickname = "update", notes = "修改下载记录表", tags = {"materialDownload",})
    @RequestMapping(value = "/materialDownload/{id}", method = RequestMethod.PUT)
    @MartinLog("编辑下载记录表")
    public R update(@ApiParam(value = "Id", required = true) @PathVariable("id")  String id,  @ApiParam(value = "", required = true) @Valid @RequestBody  MaterialDownload materialDownload) {
        LambdaQueryWrapper<MaterialDownload> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MaterialDownload::getId, id);
        return R.ok(materialDownloadService.update(materialDownload,wrapper));
    }
}

