package com.erdonline.erd.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.erdonline.common.bean.system.MultiDelete;
import com.erdonline.common.core.api.R;
import com.erdonline.common.log.annotation.MartinLog;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.entity.DataSources;
import com.erdonline.erd.security.DataSourceAcl;
import com.erdonline.erd.service.DataSourcesService;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;


/**
 * 数据源接口
 *
 * @author 零代科技
 * @version 1.0
 * @date 2024-09-07
 * @describtion
 * @since 1.0
 */
@Slf4j
@RestController
@RequestMapping
public class DataSourcesController {

    @Autowired
    private DataSourcesService dataSourcesService;

    @Autowired
    private DataSourceAcl dataSourceAcl;

    @ApiOperation(value = "数据源", nickname = "create", notes = "新增数据源", tags = {"dataSources",})
    @RequestMapping(value = "/dataSources", method = RequestMethod.POST)
    @MartinLog("添加数据源")
    public R create(@ApiParam(value = "", required = true) @Valid @RequestBody DataSources dataSources) {
        return R.ok(dataSourcesService.save(dataSources));
    }

    @ApiOperation(value = "数据源", nickname = "delete", notes = "删除数据源", tags = {"dataSources",})
    @RequestMapping(value = "/dataSources/{id}", method = RequestMethod.DELETE)
    @MartinLog("删除数据源")
    public R delete(@ApiParam(value = "Id", required = true) @PathVariable("id") String id) {
        dataSourceAcl.assertOwned(id);
        return R.ok(dataSourcesService.removeById(id));
    }

    @ApiOperation(value = "数据源", nickname = "list", notes = "分页查询数据源", tags = {"dataSources",})
    @RequestMapping(value = "/dataSources", method = RequestMethod.GET)
    @MartinLog("分页查询数据源")
    @SneakyThrows
    public R list(@RequestParam Map<String, Object> map) {
        String username = SecurityContextUtil.getAccessUser().getUsername();
        map.put("creator", username);
        return R.ok(dataSourcesService.getPage(map));
    }

    @ApiOperation(value = "数据源", nickname = "multipleDelete", notes = "批量删除数据源", tags = {"dataSources",})
    @RequestMapping(value = "/dataSources/multiple_delete", method = RequestMethod.DELETE)
    @MartinLog("批量删除数据源")
    public R multipleDelete(@ApiParam(value = "", required = true) @Valid @RequestBody MultiDelete dataSources) {
        List<?> keys = dataSources.getKeys();
        if (keys != null) {
            for (Object key : keys) {
                dataSourceAcl.assertOwned(String.valueOf(key));
            }
        }
        return R.ok(dataSourcesService.removeByIds(keys));
    }

    @ApiOperation(value = "数据源", nickname = "partialUpdate", notes = "编辑数据源", tags = {"dataSources",})
    @RequestMapping(value = "/dataSources/{id}", method = RequestMethod.PATCH)
    @MartinLog("编辑数据源")
    public R partialUpdate(@ApiParam(value = "Id", required = true) @PathVariable("id") String id,
                           @ApiParam(value = "", required = true) @Valid @RequestBody DataSources dataSources) {
        dataSourceAcl.assertOwned(id);
        dataSources.setId(id);
        dataSources.setCreator(null);
        return R.ok(dataSourcesService.updateById(dataSources));
    }

    @ApiOperation(value = "数据源", nickname = "read", notes = "获取单个数据源", tags = {"dataSources",})
    @RequestMapping(value = "/dataSources/{id}", method = RequestMethod.GET)
    @MartinLog("获取单个数据源")
    public R read(@ApiParam(value = "Id", required = true) @PathVariable("id") String id) {
        return R.ok(dataSourceAcl.requireOwned(id));
    }

    @ApiOperation(value = "数据源", nickname = "tree", notes = "获取数据源树", tags = {"dataSources",})
    @RequestMapping(value = "/dataSources/tree", method = RequestMethod.GET)
    @MartinLog("获取数据源树")
    public R tree(@ApiParam(value = "", required = true) DataSources dataSources) {
        if (dataSources == null) {
            dataSources = new DataSources();
        }
        dataSources.setCreator(SecurityContextUtil.getAccessUser().getUsername());
        return R.ok(dataSourcesService.tree(dataSources));
    }

    @ApiOperation(value = "数据源", nickname = "update", notes = "修改数据源", tags = {"dataSources",})
    @RequestMapping(value = "/dataSources/{id}", method = RequestMethod.PUT)
    @MartinLog("编辑数据源")
    public R update(@ApiParam(value = "Id", required = true) @PathVariable("id") String id,
                    @ApiParam(value = "", required = true) @Valid @RequestBody DataSources dataSources) {
        dataSourceAcl.assertOwned(id);
        dataSources.setCreator(null);
        LambdaQueryWrapper<DataSources> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DataSources::getId, id);
        return R.ok(dataSourcesService.update(dataSources, wrapper));
    }
}
