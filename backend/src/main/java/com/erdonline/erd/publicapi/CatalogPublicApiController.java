package com.erdonline.erd.publicapi;

import com.erdonline.common.core.api.R;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.catalog.CatalogCreatorView;
import com.erdonline.erd.catalog.CatalogInstallResultView;
import com.erdonline.erd.catalog.CatalogPageView;
import com.erdonline.erd.catalog.CatalogService;
import com.erdonline.erd.catalog.CatalogTemplateDetailView;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * MCP / PAT 读写的 catalog 面（ADR-0028 slice 5）。
 */
@RestController
@RequestMapping("/api/v1/catalog")
@Tag(name = "Public API Catalog", description = "模板广场 PAT 面；install 需 projects:write")
@SecurityRequirement(name = "bearer-pat")
@RequiredArgsConstructor
public class CatalogPublicApiController {

    private final CatalogService catalogService;

    @GetMapping("/templates")
    @Operation(summary = "模板列表")
    public R<CatalogPageView> listTemplates(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "installs") String sort,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        PatScopes.require(SecurityContextUtil.getAuthorities(), PatScopes.PROJECTS_READ);
        var user = SecurityContextUtil.getAccessUser();
        return R.ok(catalogService.listTemplates(q, tag, sort, page, size, user.getId()));
    }

    @GetMapping("/templates/{id}")
    @Operation(summary = "模板详情")
    public R<CatalogTemplateDetailView> getTemplate(@PathVariable String id) {
        PatScopes.require(SecurityContextUtil.getAuthorities(), PatScopes.PROJECTS_READ);
        var user = SecurityContextUtil.getAccessUser();
        return R.ok(catalogService.getTemplate(id, user.getId()));
    }

    @PostMapping("/templates/{id}/install")
    @Operation(summary = "安装模板（需 projects:write）")
    public R<CatalogInstallResultView> installTemplate(@PathVariable String id) {
        PatScopes.require(SecurityContextUtil.getAuthorities(), PatScopes.PROJECTS_WRITE);
        var user = SecurityContextUtil.getAccessUser();
        return catalogService.installTemplate(id, user.getId(), user.getUsername());
    }

    @GetMapping("/creators/{handle}")
    @Operation(summary = "作者页")
    public R<CatalogCreatorView> getCreator(@PathVariable String handle) {
        PatScopes.require(SecurityContextUtil.getAuthorities(), PatScopes.PROJECTS_READ);
        return R.ok(catalogService.getCreator(handle));
    }
}
