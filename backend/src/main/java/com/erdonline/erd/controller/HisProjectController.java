package com.erdonline.erd.controller;

import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.RandomUtil;
import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.erdonline.common.core.api.R;
import com.erdonline.common.log.annotation.MartinLog;
import com.erdonline.erd.entity.DbChange;
import com.erdonline.erd.service.DbChangeService;
import com.erdonline.erd.service.DbVersionService;
import com.erdonline.erd.util.JsonUtil;
import io.swagger.annotations.ApiOperation;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * @author 狮少
 * @version 1.0
 * @date 2020/10/28
 * @describtion HisProjectController
 * @since 1.0
 */
@Slf4j
@RestController
@RequestMapping
public class HisProjectController {
    @Autowired
    DbChangeService dbChangeService;

    @Autowired
    private DbVersionService dbVersionService;


    /**
     * 加载历史项目版本号
     *
     * @param map Map
     * @return R
     */
    @PostMapping("/hisProject/load")
    public R loadHistory(@RequestBody Map map) {
        return dbChangeService.loadHistory(map);

    }

    /**
     * 加载历史项目版本号
     *
     * @param map Map
     * @return R
     */
    @ApiOperation(value = "模型变更历史", nickname = "list", notes = "分页查询模型变更历史", tags = {"dbChange",})
    @SneakyThrows
    @RequestMapping(value = "/dbChange", method = RequestMethod.POST)
    @MartinLog("分页查询历史变更")
    public R list(@RequestBody  Map<String,Object> map) {
        return R.ok(dbChangeService.getPage(map));

    }

    /**
     * 删除版本
     *
     * @param changeId String
     * @return R
     */
    @PostMapping("/hisProject/delete/{changeId}")
    public R deleteHistory(@PathVariable String changeId) {
        return dbChangeService.deleteHistory(changeId);

    }

    /**
     * 删除项目下所有版本版本
     *
     * @param map Map
     * @return R
     */
    @PostMapping("/hisProject/deleteAll")
    public R deleteAllHistory(@RequestBody DbChange dbChange) {
        return dbChangeService.deleteAllHistory(dbChange);

    }

    @PostMapping("/hisProject/save")
    public R save(@RequestBody DbChange dbChange) {
        log.info("dbChange: {}", dbChange);
        if (StrUtil.isBlank(dbChange.getId())) {
            dbChangeService.save(dbChange);
        } else {
            dbChangeService.updateById(dbChange);
        }
        return R.ok("保存成功");
    }
}
