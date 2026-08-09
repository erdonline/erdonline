package com.erdonline.erd.controller;

import com.erdonline.common.core.api.R;
import com.erdonline.common.log.annotation.MartinLog;
import com.erdonline.erd.security.annotation.DbKey;
import com.erdonline.erd.security.annotation.ProjectId;
import com.erdonline.erd.security.annotation.RequireProjectAccess;
import com.erdonline.erd.service.DbChangeService;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 项目 DDL 渲染（只读 Freemarker）。与 {@link HisProjectController} 版本生命周期分域；
 * 见 ADR-0031。
 */
@Slf4j
@RestController
@RequestMapping("/projectDdl")
public class ProjectDdlController {

    @Autowired
    DbChangeService dbChangeService;

    @ApiOperation(value = "DDL 模板草稿预览（后端 Freemarker）", nickname = "previewTemplate",
            notes = "模板编辑器右侧预览窗；样例实体 T_SAMPLE",
            tags = {"projectDdl",})
    @RequireProjectAccess
    @PostMapping("/previewTemplate")
    @MartinLog("DDL 模板预览")
    public R previewTemplate(@ProjectId @DbKey @RequestBody Map<String, Object> body) {
        return dbChangeService.previewDdlTemplate(body);
    }

    @ApiOperation(value = "项目 DDL 导出（后端权威）", nickname = "export",
            notes = "按片段键/表过滤导出全量 DDL；导出对话框消费此结果",
            tags = {"projectDdl",})
    @RequireProjectAccess
    @PostMapping("/export")
    @MartinLog("项目 DDL 导出")
    public R export(@ProjectId @DbKey @RequestBody Map<String, Object> body) {
        return dbChangeService.generateExportDdl(body);
    }

    @ApiOperation(value = "单表元数据 DDL 预览（后端权威）", nickname = "table",
            notes = "表属性页 DDL 标签消费此结果",
            tags = {"projectDdl",})
    @RequireProjectAccess
    @PostMapping("/table")
    @MartinLog("单表 DDL 预览")
    public R table(@ProjectId @DbKey @RequestBody Map<String, Object> body) {
        return dbChangeService.generateTableDdl(body);
    }
}
