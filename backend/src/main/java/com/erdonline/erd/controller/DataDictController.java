package com.erdonline.erd.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.erdonline.common.bean.system.MultiDelete;
import com.erdonline.common.core.api.R;
import com.erdonline.common.log.annotation.MartinLog;
import io.swagger.annotations.ApiOperation;


import com.baomidou.mybatisplus.core.metadata.IPage;
import com.erdonline.erd.entity.DataDict;
import com.erdonline.erd.service.DataDictService;
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
 * 数据字典表 接口
 *
 * @author 零代科技
 * @version 1.0
 * @date 2024-10-05
 * @describtion
 * @since 1.0
 */
@Slf4j
@RestController
@RequestMapping
public class DataDictController{

    @Autowired
    private DataDictService dataDictService;

    @ApiOperation(value = "数据字典表 ", nickname = "create", notes = "新增数据字典表 ", tags = {"dataDict",})
    @RequestMapping(value = "/dataDict", method = RequestMethod.POST)
    @MartinLog("添加数据字典表 ")
    public R create(@ApiParam(value = "", required = true) @Valid @RequestBody DataDict dataDict) {
        return R.ok(dataDictService.save(dataDict));
    }

    @ApiOperation(value = "数据字典表 ", nickname = "delete", notes = "删除数据字典表 ", tags = {"dataDict",})
    @RequestMapping(value = "/dataDict/{id}", method = RequestMethod.DELETE)
    @MartinLog("删除数据字典表 ")
    public R delete(@ApiParam(value = "Id", required = true) @PathVariable("id") String id) {
        return R.ok(dataDictService.removeById(id));
    }

    @ApiOperation(value = "数据字典表 ", nickname = "list", notes = "分页查询数据字典表 ", tags = {"dataDict",})
    @RequestMapping(value = "/dataDict", method = RequestMethod.GET)
    @MartinLog("分页查询数据字典表 ")
    @SneakyThrows
    public R list(@RequestParam Map<String,Object> map) {
        return R.ok(dataDictService.getPage(map));
    }

    @ApiOperation(value = "数据字典表 ", nickname = "multipleDelete", notes = "批量删除数据字典表 ", tags = {"dataDict",})
    @RequestMapping(value = "/dataDict/multiple_delete", method = RequestMethod.DELETE)
    @MartinLog("批量删除数据字典表 ")
    public R multipleDelete(@ApiParam(value = "", required = true) @Valid @RequestBody MultiDelete dataDict) {
        return R.ok(dataDictService.removeByIds(dataDict.getKeys()));
    }

    @ApiOperation(value = "数据字典表 ", nickname = "partialUpdate", notes = "编辑数据字典表 ", tags = {"dataDict",})
    @RequestMapping(value = "/dataDict/{id}", method = RequestMethod.PATCH)
    @MartinLog("编辑数据字典表 ")
    public R partialUpdate(@ApiParam(value = "Id", required = true) @PathVariable("id") String id, @ApiParam(value = "", required = true) @Valid @RequestBody DataDict dataDict) {
        return R.ok(dataDictService.updateById(dataDict));
    }

    @ApiOperation(value = "数据字典表 ", nickname = "read", notes = "获取单个数据字典表 ", tags = {"dataDict",})
    @RequestMapping(value = "/dataDict/{id}", method = RequestMethod.GET)
    @MartinLog("获取单个数据字典表 ")
    public R read(@ApiParam(value = "Id", required = true) @PathVariable("id") String id) {
        return R.ok(dataDictService.getById(id));
    }

    @ApiOperation(value = "数据字典表 ", nickname = "tree", notes = "获取数据字典表 树", tags = {"dataDict",})
    @RequestMapping(value = "/dataDict/tree", method = RequestMethod.GET)
    @MartinLog("获取数据字典表 树")
    public R tree(@ApiParam(value = "", required = true) DataDict dataDict) {
        return R.ok(dataDictService.tree(dataDict));
    }

    @ApiOperation(value = "数据字典表 ", nickname = "update", notes = "修改数据字典表 ", tags = {"dataDict",})
    @RequestMapping(value = "/dataDict/{id}", method = RequestMethod.PUT)
    @MartinLog("编辑数据字典表 ")
    public R update(@ApiParam(value = "Id", required = true) @PathVariable("id")  String id,  @ApiParam(value = "", required = true) @Valid @RequestBody  DataDict dataDict) {
        LambdaQueryWrapper<DataDict> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DataDict::getId, id);
        return R.ok(dataDictService.update(dataDict,wrapper));
    }
}

