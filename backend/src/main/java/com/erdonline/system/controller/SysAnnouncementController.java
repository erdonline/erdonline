package com.erdonline.system.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.erdonline.common.bean.system.MultiDelete;
import com.erdonline.common.core.api.R;
import com.erdonline.common.log.annotation.MartinLog;
import io.swagger.annotations.ApiOperation;


import com.baomidou.mybatisplus.core.metadata.IPage;
import com.erdonline.system.entity.SysAnnouncement;
import com.erdonline.system.service.SysAnnouncementService;
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
 * 公告表 接口
 *
 * @author 零代科技
 * @version 1.0
 * @date 2023-10-04
 * @describtion
 * @since 1.0
 */
@Slf4j
@RestController
@RequestMapping
public class SysAnnouncementController{
    @Autowired
    private SysAnnouncementService sysAnnouncementService;

//    @ApiOperation(value = "公告表 ", nickname = "create", notes = "新增公告表 ", tags = {"sysAnnouncement",})
//    @RequestMapping(value = "/sysAnnouncement", method = RequestMethod.POST)
//    @MartinLog("添加公告表 ")
//    public R create(@ApiParam(value = "", required = true) @Valid @RequestBody SysAnnouncement sysAnnouncement) {
//        return R.ok(sysAnnouncementService.save(sysAnnouncement));
//    }

    @ApiOperation(value = "公告表 ", nickname = "list", notes = "分页查询公告表 ", tags = {"sysAnnouncement",})
    @RequestMapping(value = "/sysAnnouncement", method = RequestMethod.POST)
    @MartinLog("分页查询公告表 ")
    @SneakyThrows
    public R list(@RequestBody Map<String,Object> map) {
        return R.ok(sysAnnouncementService.getPage(map));
    }
}

