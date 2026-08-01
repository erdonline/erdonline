package com.erdonline.system.controller;

import cn.hutool.core.collection.CollUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.erdonline.common.bean.system.Config;
import com.erdonline.system.service.ConfigService;
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

import jakarta.validation.Valid;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;



/**
 * <p>
 * 系统配置  前端控制器
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
@RequestMapping("config")
@Api(value = "Config 控制器", tags = "系统配置 ")
public class ConfigController {

    @Autowired
    private ConfigService configService;


    /**
     * 添加
     *
     * @param config Config
     * @return R
     */
    @MartinLog("添加系统配置 ")
    @PostMapping
    public R save(@Valid @RequestBody Config config) {
        return R.ok(configService.save(config));
    }

    /**
     * 删除
     *
     * @param config Config
     * @return R
     */
    @MartinLog("删除系统配置 ")
    @DeleteMapping
    public R removeById(@Valid @RequestBody Config config) {
        return R.ok(configService.removeById(config.getId()));
    }

    /**
     * 编辑
     *
     * @param config Config
     * @return R
     */
    @MartinLog("编辑系统配置 ")
    @PutMapping
    public R edit(@Valid @RequestBody Config config) {
        return R.ok(configService.updateById(config));
    }

    /**
     * 通过ID查询
     *
     * @param config Config
     * @return R
     */
    @MartinLog("单个查询系统配置 ")
    @GetMapping
    public R getById(Config config) {
        return R.ok(configService.getById(config.getId()));
    }

    /**
     * 分页查询
     *
     * @param params 分页以及查询参数
     * @return R
     */
    @SneakyThrows
    @MartinLog("分页查询系统配置 ")
    @GetMapping("/page")
    public R<IPage> getPage(@RequestParam(required = false) Map params) {
        return R.ok(configService.getPage(params));
    }

    @MartinLog("批量删除系统配置 ")
    @DeleteMapping("/batch")
    public R removeBatch(@RequestBody String ids) {
        List<String> idList = Arrays.stream(ids.split(",")).collect(Collectors.toList());
        if (CollUtil.isEmpty(idList)) {
            return R.failed("ids 不能为空");
        }
        return R.ok(configService.removeByIds(idList));
    }


}

