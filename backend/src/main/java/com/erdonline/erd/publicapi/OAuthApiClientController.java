package com.erdonline.erd.publicapi;

import com.erdonline.common.core.api.R;
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
 * OAuth API client 管理（会话 JWT）。客户端路径：{@code /auth/oauth-clients}（前缀剥离后本映射）。
 */
@RestController
@RequestMapping("/oauth-clients")
@RequiredArgsConstructor
@Tag(name = "OAuth API Clients", description = "会话鉴权下注册/列表/吊销 OAuth client（ADR-0013 切片 A）")
public class OAuthApiClientController {

    private final OAuthApiClientService oauthApiClientService;

    @PostMapping
    @Operation(summary = "注册 OAuth client（client_secret 明文仅返回一次）")
    public R create(@Valid @RequestBody CreateOAuthClientRequest request) {
        try {
            return R.ok(oauthApiClientService.create(request));
        } catch (IllegalArgumentException ex) {
            return R.failed(ex.getMessage());
        }
    }

    @GetMapping
    @Operation(summary = "列出当前用户的 OAuth client（无密文）")
    public R list() {
        List<OAuthClientSummaryView> list = oauthApiClientService.listMine();
        return R.ok(list);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "吊销 OAuth client（并使未过期 access_token 失效）")
    public R revoke(@PathVariable String id) {
        try {
            oauthApiClientService.revoke(id);
            Map<String, Object> ok = new HashMap<>(2);
            ok.put("id", id);
            ok.put("revoked", true);
            return R.ok(ok);
        } catch (IllegalArgumentException ex) {
            return R.failed(ex.getMessage());
        }
    }
}
