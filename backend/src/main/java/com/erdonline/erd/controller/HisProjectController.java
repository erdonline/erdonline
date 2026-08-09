package com.erdonline.erd.controller;

import com.erdonline.common.core.api.R;
import com.erdonline.common.log.annotation.MartinLog;
import com.erdonline.erd.entity.DbChange;
import com.erdonline.erd.service.DbChangeService;
import io.swagger.annotations.ApiOperation;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 历史版本 / 模型变更。
 */
@Slf4j
@RestController
@RequestMapping
public class HisProjectController {
    @Autowired
    DbChangeService dbChangeService;

    @PostMapping("/hisProject/load")
    public R loadHistory(@RequestBody Map map) {
        return dbChangeService.loadHistory(map);
    }

    @ApiOperation(value = "模型变更历史", nickname = "list", notes = "分页查询模型变更历史", tags = {"dbChange",})
    @SneakyThrows
    @RequestMapping(value = "/dbChange", method = RequestMethod.POST)
    @MartinLog("分页查询历史变更")
    public R list(@RequestBody Map<String, Object> map) {
        return R.ok(dbChangeService.getPage(map));
    }

    @PostMapping("/hisProject/delete/{changeId}")
    public R deleteHistory(@PathVariable String changeId) {
        return dbChangeService.deleteHistory(changeId);
    }

    @PostMapping("/hisProject/deleteAll")
    public R deleteAllHistory(@RequestBody DbChange dbChange) {
        return dbChangeService.deleteAllHistory(dbChange);
    }

    @PostMapping("/hisProject/save")
    public R save(@RequestBody DbChange dbChange) {
        log.info("dbChange: {}", dbChange);
        return dbChangeService.saveVersion(dbChange);
    }

    @ApiOperation(value = "A 层全量差异（后端权威）", nickname = "diff",
            notes = "当前模型 ↔ 最新版本基线的 structural diff；「未保存版本」/ 比对面板均消费此结果",
            tags = {"dbChange",})
    @PostMapping("/hisProject/diff")
    @MartinLog("A 层差异计算")
    public R diff(@RequestBody Map<String, Object> body) {
        return dbChangeService.diffAgainstLatest(body);
    }
}
