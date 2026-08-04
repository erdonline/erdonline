package com.erdonline.erd.publicapi;

import com.erdonline.common.core.api.R;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.common.security.util.SecurityContextUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * PAT 管理（会话 JWT）。客户端路径：{@code POST/GET /auth/personal-access-tokens}（前缀剥离后本映射）。
 */
@RestController
@RequestMapping("/personal-access-tokens")
@RequiredArgsConstructor
@Tag(name = "Personal Access Tokens", description = "会话鉴权下铸造/列表/吊销 PAT（ADR-0013）")
public class PersonalAccessTokenController {

    private final PersonalAccessTokenService personalAccessTokenService;

    @PostMapping
    @Operation(summary = "铸造 PAT（明文仅返回一次）")
    public R create(@Valid @RequestBody CreatePatRequest request) {
        try {
            PatCreatedView created = personalAccessTokenService.create(request);
            return R.ok(created);
        } catch (IllegalArgumentException ex) {
            return R.failed(ex.getMessage());
        }
    }

    @GetMapping
    @Operation(summary = "列出当前用户的 PAT（无明文）")
    public R list() {
        List<PatSummaryView> list = personalAccessTokenService.listMine();
        return R.ok(list);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "吊销 PAT")
    public R revoke(@PathVariable String id) {
        try {
            personalAccessTokenService.revoke(id);
            Map<String, Object> ok = new HashMap<>(2);
            ok.put("id", id);
            ok.put("revoked", true);
            return R.ok(ok);
        } catch (IllegalArgumentException ex) {
            return R.failed(ex.getMessage());
        }
    }

    @GetMapping("/whoami")
    @Operation(summary = "会话用户自检（JWT）")
    public R whoami() {
        MartinUser user = SecurityContextUtil.getAccessUser();
        Map<String, Object> body = new HashMap<>(4);
        body.put("userId", user.getId());
        body.put("username", user.getUsername());
        return R.ok(body);
    }
}
