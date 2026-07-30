package com.erdonline.system.controller;

import cn.hutool.core.collection.CollUtil;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.erdonline.common.bean.system.User;
import com.erdonline.system.service.UserService;
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
 * 系统用户 前端控制器
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
@RequestMapping("user")
@Api(value = "User 控制器", tags = "系统用户")
public class UserController {

    @Autowired
    private UserService userService;


    /**
     * 添加
     *
     * @param user User
     * @return R
     */
    @MartinLog("添加系统用户")
    @PostMapping
    public R save(@Valid @RequestBody User user) {
        return R.ok(userService.save(user));
    }

    /**
     * 删除
     *
     * @param user User
     * @return R
     */
    @MartinLog("删除系统用户")
    @DeleteMapping
    public R removeById(@Valid @RequestBody User user) {
        return R.ok(userService.removeById(user.getId()));
    }

    /**
     * 编辑
     *
     * @param user User
     * @return R
     */
    @MartinLog("编辑系统用户")
    @PutMapping
    public R edit(@Valid @RequestBody User user) {
        return R.ok(userService.updateById(user));
    }

    /**
     * 通过ID查询
     *
     * @param user User
     * @return R
     */
    @MartinLog("单个查询系统用户")
    @GetMapping
    public R getById(User user) {
        return R.ok(userService.getById(user.getId()));
    }

    /**
     * 分页查询
     *
     * @param params 分页以及查询参数
     * @return R
     */
    @SneakyThrows
    @MartinLog("分页查询系统用户")
    @GetMapping("/page")
    public R<IPage> getPage(@RequestParam(required = false) Map params) {
        return R.ok(userService.getPage(params));
    }

    @MartinLog("批量删除系统用户")
    @DeleteMapping("/batch")
    public R removeBatch(@RequestBody String ids) {
        List<String> idList = Arrays.stream(ids.split(",")).collect(Collectors.toList());
        if (CollUtil.isEmpty(idList)) {
            return R.failed("ids 不能为空");
        }
        return R.ok(userService.removeByIds(idList));
    }


}

