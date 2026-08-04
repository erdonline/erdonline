package com.erdonline.erd.publicapi;

import com.erdonline.common.core.api.R;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.common.security.util.SecurityContextUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 公开 API v1 探针：证明 PAT 鉴权可用。后续项目/版本只读 endpoint 挂同一前缀。
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Public API v1", description = "Bearer PAT（erd_pat_…）；prod 仍走 springdoc 门控")
@SecurityRequirement(name = "bearer-pat")
public class PublicApiV1Controller {

    @GetMapping("/me")
    @Operation(summary = "PAT 鉴权自检")
    public R me() {
        MartinUser user = SecurityContextUtil.getAccessUser();
        List<String> scopes = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .sorted()
                .collect(Collectors.toList());
        Map<String, Object> body = new HashMap<>(8);
        body.put("userId", user.getId());
        body.put("username", user.getUsername());
        body.put("scopes", scopes);
        body.put("auth", "pat");
        return R.ok(body);
    }
}
