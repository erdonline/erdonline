package com.erdonline.system.controller;

import cn.hutool.core.collection.CollUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.erdonline.common.bean.system.File;
import com.erdonline.system.service.FileService;
import com.erdonline.common.core.api.R;
import com.erdonline.common.log.annotation.MartinLog;
import io.swagger.annotations.Api;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;



/**
 * <p>
 * 系统文件 前端控制器
 * </p>
 *
 * @author 狮少
 * @version 1.0
 * @date 2021-05-08
 * @describtion
 * @since 1.0
 */
@Slf4j
@RestController
@RequestMapping("file")
@Api(value = "File 控制器", tags = "系统文件")
public class FileController {

    @Autowired
    private FileService fileService;


    /**
     * 添加
     *
     * @param file File
     * @return R
     */
    @MartinLog("添加系统文件")
    @PostMapping
    public R save(@Valid @RequestBody File file) {
        return R.ok(fileService.save(file));
    }

    /**
     * 删除
     *
     * @param file File
     * @return R
     */
    @MartinLog("删除系统文件")
    @DeleteMapping
    public R removeById(@Valid @RequestBody File file) {
        return R.ok(fileService.removeById(file.getId()));
    }

    /**
     * 编辑
     *
     * @param file File
     * @return R
     */
    @MartinLog("编辑系统文件")
    @PutMapping
    public R edit(@Valid @RequestBody File file) {
        return R.ok(fileService.updateById(file));
    }

    /**
     * 通过ID查询
     *
     * @param file File
     * @return R
     */
    @MartinLog("单个查询系统文件")
    @GetMapping
    public R getById(File file) {
        return R.ok(fileService.getById(file.getId()));
    }

    /**
     * 分页查询
     *
     * @param params 分页以及查询参数
     * @return R
     */
    @SneakyThrows
    @MartinLog("分页查询系统文件")
    @GetMapping("/page")
    public R<IPage> getPage(@RequestParam(required = false) Map params) {
        return R.ok(fileService.getPage(params));
    }

    @MartinLog("批量删除系统文件")
    @DeleteMapping("/batch")
    public R removeBatch(@RequestBody String ids) {
        List<String> idList = Arrays.stream(ids.split(",")).collect(Collectors.toList());
        if (CollUtil.isEmpty(idList)) {
            return R.failed("ids 不能为空");
        }
        return R.ok(fileService.removeByIds(idList));
    }


}

