package com.erdonline.erd.controller;

import com.erdonline.common.core.api.R;
import com.erdonline.erd.service.ProjectShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 项目只读分享：创建需登录；凭 token 匿名读取。
 *
 * @author erdonline
 */
@RestController
@RequestMapping("share")
@RequiredArgsConstructor
public class ProjectShareController {

    private final ProjectShareService projectShareService;

    @PostMapping("create")
    public R create(@RequestBody Map<String, String> body) {
        return projectShareService.createShare(body.get("projectId"));
    }

    @GetMapping("{token}")
    public R get(@PathVariable String token) {
        return projectShareService.getByToken(token);
    }

    @PostMapping("revoke")
    public R revoke(@RequestBody Map<String, String> body) {
        return projectShareService.revoke(body.get("token"));
    }

    /** 登录后将分享复制为个人项目 */
    @PostMapping("{token}/fork")
    public R fork(@PathVariable String token) {
        return projectShareService.forkFromShare(token);
    }
}
