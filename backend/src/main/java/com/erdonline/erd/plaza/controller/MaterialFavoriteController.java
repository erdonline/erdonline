package com.erdonline.erd.plaza.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.erdonline.common.bean.system.MultiDelete;
import com.erdonline.common.core.api.R;
import com.erdonline.common.log.annotation.MartinLog;
import io.swagger.annotations.ApiOperation;


import com.baomidou.mybatisplus.core.metadata.IPage;
import com.erdonline.erd.plaza.entity.MaterialFavorite;
import com.erdonline.erd.plaza.service.MaterialFavoriteService;
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
 * 用户收藏表接口
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
public class MaterialFavoriteController{

    @Autowired
    private MaterialFavoriteService materialFavoriteService;

    @ApiOperation(value = "用户收藏表", nickname = "create", notes = "新增用户收藏表", tags = {"materialFavorite",})
    @RequestMapping(value = "/materialFavorite", method = RequestMethod.POST)
    @MartinLog("添加用户收藏表")
    public R create(@ApiParam(value = "", required = true) @Valid @RequestBody MaterialFavorite materialFavorite) {
        return R.ok(materialFavoriteService.save(materialFavorite));
    }

    @ApiOperation(value = "用户收藏表", nickname = "delete", notes = "删除用户收藏表", tags = {"materialFavorite",})
    @RequestMapping(value = "/materialFavorite/{id}", method = RequestMethod.DELETE)
    @MartinLog("删除用户收藏表")
    public R delete(@ApiParam(value = "Id", required = true) @PathVariable("id") String id) {
        return R.ok(materialFavoriteService.removeById(id));
    }

    @ApiOperation(value = "用户收藏表", nickname = "list", notes = "分页查询用户收藏表", tags = {"materialFavorite",})
    @RequestMapping(value = "/materialFavorite", method = RequestMethod.GET)
    @MartinLog("分页查询用户收藏表")
    @SneakyThrows
    public R list(@RequestParam Map<String,Object> map) {
        return R.ok(materialFavoriteService.getPage(map));
    }

    @ApiOperation(value = "用户收藏表", nickname = "multipleDelete", notes = "批量删除用户收藏表", tags = {"materialFavorite",})
    @RequestMapping(value = "/materialFavorite/multiple_delete", method = RequestMethod.DELETE)
    @MartinLog("批量删除用户收藏表")
    public R multipleDelete(@ApiParam(value = "", required = true) @Valid @RequestBody MultiDelete materialFavorite) {
        return R.ok(materialFavoriteService.removeByIds(materialFavorite.getKeys()));
    }

    @ApiOperation(value = "用户收藏表", nickname = "partialUpdate", notes = "编辑用户收藏表", tags = {"materialFavorite",})
    @RequestMapping(value = "/materialFavorite/{id}", method = RequestMethod.PATCH)
    @MartinLog("编辑用户收藏表")
    public R partialUpdate(@ApiParam(value = "Id", required = true) @PathVariable("id") String id, @ApiParam(value = "", required = true) @Valid @RequestBody MaterialFavorite materialFavorite) {
        return R.ok(materialFavoriteService.updateById(materialFavorite));
    }

    @ApiOperation(value = "用户收藏表", nickname = "read", notes = "获取单个用户收藏表", tags = {"materialFavorite",})
    @RequestMapping(value = "/materialFavorite/{id}", method = RequestMethod.GET)
    @MartinLog("获取单个用户收藏表")
    public R read(@ApiParam(value = "Id", required = true) @PathVariable("id") String id) {
        return R.ok(materialFavoriteService.getById(id));
    }

    @ApiOperation(value = "用户收藏表", nickname = "tree", notes = "获取用户收藏表树", tags = {"materialFavorite",})
    @RequestMapping(value = "/materialFavorite/tree", method = RequestMethod.GET)
    @MartinLog("获取用户收藏表树")
    public R tree(@ApiParam(value = "", required = true) MaterialFavorite materialFavorite) {
        return R.ok(materialFavoriteService.tree(materialFavorite));
    }

    @ApiOperation(value = "用户收藏表", nickname = "update", notes = "修改用户收藏表", tags = {"materialFavorite",})
    @RequestMapping(value = "/materialFavorite/{id}", method = RequestMethod.PUT)
    @MartinLog("编辑用户收藏表")
    public R update(@ApiParam(value = "Id", required = true) @PathVariable("id")  String id,  @ApiParam(value = "", required = true) @Valid @RequestBody  MaterialFavorite materialFavorite) {
        LambdaQueryWrapper<MaterialFavorite> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MaterialFavorite::getId, id);
        return R.ok(materialFavoriteService.update(materialFavorite,wrapper));
    }
}

