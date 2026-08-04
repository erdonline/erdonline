package com.erdonline.erd.publicapi;

import com.erdonline.common.core.api.R;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.common.security.util.SecurityContextUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 公开 API v1：PAT 鉴权；项目/版本读写（成员 ACL + scope）。
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Public API v1", description = "Bearer PAT（erd_pat_…）；prod 仍走 springdoc 门控")
@SecurityRequirement(name = "bearer-pat")
@RequiredArgsConstructor
public class PublicApiV1Controller {

    private final PublicApiProjectService publicApiProjectService;
    private final PublicApiVersionService publicApiVersionService;

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

    @GetMapping("/projects")
    @Operation(summary = "列出当前 PAT 用户作为成员的项目")
    public R<PublicProjectPageView> listProjects(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return R.ok(publicApiProjectService.listMine(page, size));
    }

    @GetMapping("/projects/{id}")
    @Operation(summary = "获取项目详情（projectJSON 只读，已清 profile.dbs）")
    public R<PublicProjectDetailView> getProject(@PathVariable("id") String id) {
        return R.ok(publicApiProjectService.getMine(id));
    }

    @GetMapping("/projects/{id}/versions")
    @Operation(summary = "分页列出项目版本（需 versions:read + 成员；不含 projectJSON）")
    public R<PublicVersionPageView> listVersions(
            @PathVariable("id") String id,
            @RequestParam(required = false) String dbKey,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return R.ok(publicApiVersionService.listMine(id, dbKey, page, size));
    }

    @GetMapping("/projects/{id}/versions/{versionId}")
    @Operation(summary = "版本详情（含清洗后的 projectJSON）")
    public R<PublicVersionDetailView> getVersion(
            @PathVariable("id") String id,
            @PathVariable("versionId") String versionId) {
        return R.ok(publicApiVersionService.getMine(id, versionId));
    }

    @PostMapping("/projects/{id}/versions")
    @Operation(summary = "提交新版本（需 versions:write + 成员；写入前清空 profile.dbs）")
    public R<PublicVersionDetailView> createVersion(
            @PathVariable("id") String id,
            @Valid @RequestBody CreatePublicVersionRequest request) {
        return R.ok(publicApiVersionService.createMine(id, request));
    }
}
