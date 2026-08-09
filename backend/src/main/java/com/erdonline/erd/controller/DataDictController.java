package com.erdonline.erd.controller;

import com.erdonline.common.bean.system.MultiDelete;
import com.erdonline.common.core.api.R;
import com.erdonline.common.log.annotation.MartinLog;
import io.swagger.annotations.ApiOperation;
import com.erdonline.erd.entity.DataDict;
import com.erdonline.erd.service.DataDictService;
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

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;

/**
 * 字段库 API（ADR-0032）。
 */
@Slf4j
@RestController
@RequestMapping
public class DataDictController {

    @Autowired
    private DataDictService dataDictService;

    @ApiOperation(value = "字段库", nickname = "create", notes = "新增字段库条目", tags = {"dataDict"})
    @RequestMapping(value = "/dataDict", method = RequestMethod.POST)
    @MartinLog("添加字段库")
    public R create(@ApiParam(value = "", required = true) @Valid @RequestBody DataDict dataDict) {
        return R.ok(dataDictService.createDict(dataDict));
    }

    @ApiOperation(value = "字段库", nickname = "delete", notes = "删除字段库条目", tags = {"dataDict"})
    @RequestMapping(value = "/dataDict/{id}", method = RequestMethod.DELETE)
    @MartinLog("删除字段库")
    public R delete(@ApiParam(value = "Id", required = true) @PathVariable("id") String id) {
        return R.ok(dataDictService.deleteDict(id));
    }

    @ApiOperation(value = "字段库", nickname = "list", notes = "分页查询字段库", tags = {"dataDict"})
    @RequestMapping(value = "/dataDict", method = RequestMethod.GET)
    @MartinLog("分页查询字段库")
    @SneakyThrows
    public R list(@RequestParam Map<String, Object> map) {
        return R.ok(dataDictService.getPage(map));
    }

    @ApiOperation(value = "字段库", nickname = "multipleDelete", notes = "批量删除字段库", tags = {"dataDict"})
    @RequestMapping(value = "/dataDict/multiple_delete", method = RequestMethod.DELETE)
    @MartinLog("批量删除字段库")
    public R multipleDelete(@ApiParam(value = "", required = true) @Valid @RequestBody MultiDelete dataDict) {
        boolean ok = true;
        for (Object key : dataDict.getKeys()) {
            ok = dataDictService.deleteDict(String.valueOf(key)) && ok;
        }
        return R.ok(ok);
    }

    @ApiOperation(value = "字段库", nickname = "partialUpdate", notes = "编辑字段库", tags = {"dataDict"})
    @RequestMapping(value = "/dataDict/{id}", method = RequestMethod.PATCH)
    @MartinLog("编辑字段库")
    public R partialUpdate(
            @ApiParam(value = "Id", required = true) @PathVariable("id") String id,
            @ApiParam(value = "", required = true) @Valid @RequestBody DataDict dataDict) {
        return R.ok(dataDictService.updateDict(id, dataDict));
    }

    @ApiOperation(value = "字段库", nickname = "read", notes = "获取单个字段库条目", tags = {"dataDict"})
    @RequestMapping(value = "/dataDict/{id}", method = RequestMethod.GET)
    @MartinLog("获取单个字段库")
    public R read(@ApiParam(value = "Id", required = true) @PathVariable("id") String id) {
        return R.ok(dataDictService.getById(id));
    }

    @ApiOperation(value = "字段库", nickname = "tree", notes = "获取字段库树", tags = {"dataDict"})
    @RequestMapping(value = "/dataDict/tree", method = RequestMethod.GET)
    @MartinLog("获取字段库树")
    public R tree(
            @ApiParam(value = "") DataDict dataDict,
            @RequestParam(value = "projectId", required = false) String projectId,
            HttpServletRequest request) {
        String resolvedProjectId = resolveProjectId(projectId, request);
        return R.ok(dataDictService.tree(dataDict, resolvedProjectId));
    }

    @ApiOperation(value = "字段库", nickname = "apply", notes = "应用到表（copy-on-apply）", tags = {"dataDict"})
    @RequestMapping(value = "/dataDict/{id}/apply", method = RequestMethod.POST)
    @MartinLog("应用字段库到表")
    public R apply(@ApiParam(value = "Id", required = true) @PathVariable("id") String id) {
        return R.ok(dataDictService.apply(id));
    }

    @ApiOperation(value = "字段库", nickname = "update", notes = "修改字段库", tags = {"dataDict"})
    @RequestMapping(value = "/dataDict/{id}", method = RequestMethod.PUT)
    @MartinLog("编辑字段库")
    public R update(
            @ApiParam(value = "Id", required = true) @PathVariable("id") String id,
            @ApiParam(value = "", required = true) @Valid @RequestBody DataDict dataDict) {
        return R.ok(dataDictService.updateDict(id, dataDict));
    }

    private static String resolveProjectId(String queryProjectId, HttpServletRequest request) {
        if (queryProjectId != null && !queryProjectId.isBlank()) {
            return queryProjectId.trim();
        }
        String header = request.getHeader("projectId");
        if (header != null && !header.isBlank()) {
            return header.trim();
        }
        return null;
    }
}
