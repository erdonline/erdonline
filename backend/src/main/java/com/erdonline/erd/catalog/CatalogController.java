package com.erdonline.erd.catalog;

import com.erdonline.common.core.api.R;
import com.erdonline.common.security.util.SecurityContextUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 模板广场浏览器 API（会话 JWT；列表/详情匿名可读）。
 */
@RestController
@RequestMapping({"/catalog/v1", "/ncnb/catalog/v1"})
@Tag(name = "Catalog v1", description = "官方模板广场（ADR-0028）")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    @GetMapping("/templates")
    @Operation(summary = "模板列表（搜索/标签/排序）")
    public R<CatalogPageView> listTemplates(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "installs") String sort,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        String userId = currentUserIdOrNull();
        return R.ok(catalogService.listTemplates(q, tag, sort, page, size, userId));
    }

    @GetMapping("/templates/{id}")
    @Operation(summary = "模板详情（含 projectJSON 预览）")
    public R<CatalogTemplateDetailView> getTemplate(@PathVariable String id) {
        return R.ok(catalogService.getTemplate(id, currentUserIdOrNull()));
    }

    @PostMapping("/templates/{id}/install")
    @Operation(summary = "安装模板为个人项目（fork 等价脱敏）")
    public R installTemplate(@PathVariable String id) {
        var user = SecurityContextUtil.getAccessUser();
        return catalogService.installTemplate(id, user.getId(), user.getUsername());
    }

    @PostMapping("/templates/{id}/rating")
    @Operation(summary = "评分（须已安装；每用户一票）")
    public R rateTemplate(@PathVariable String id, @Valid @RequestBody RateTemplateRequest request) {
        var user = SecurityContextUtil.getAccessUser();
        return catalogService.rateTemplate(id, user.getId(), request.getScore());
    }

    @GetMapping("/creators/{handle}")
    @Operation(summary = "作者页（GitHub handle）")
    public R<CatalogCreatorView> getCreator(@PathVariable String handle) {
        return R.ok(catalogService.getCreator(handle));
    }

    @PostMapping("/submissions")
    @Operation(summary = "提交发布为模板（须绑定 GitHub）")
    public R submitTemplate(@Valid @RequestBody SubmitTemplateRequest request) {
        var user = SecurityContextUtil.getAccessUser();
        return catalogService.submitTemplate(user.getId(), user.getUsername(), request);
    }

    @GetMapping("/submissions")
    @Operation(summary = "待审列表（维护者）")
    public R<CatalogPageView> listSubmissions(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        var user = SecurityContextUtil.getAccessUser();
        return R.ok(catalogService.listSubmissions(user.getUsername(), page, size));
    }

    @PostMapping("/submissions/{id}/approve")
    @Operation(summary = "审核通过")
    public R approveSubmission(@PathVariable String id) {
        var user = SecurityContextUtil.getAccessUser();
        return catalogService.approveSubmission(id, user.getId(), user.getUsername());
    }

    @PostMapping("/submissions/{id}/reject")
    @Operation(summary = "审核拒绝")
    public R rejectSubmission(@PathVariable String id, @RequestBody(required = false) ReviewSubmissionRequest request) {
        var user = SecurityContextUtil.getAccessUser();
        String note = request != null ? request.getNote() : null;
        return catalogService.rejectSubmission(id, user.getId(), user.getUsername(), note);
    }

    private static String currentUserIdOrNull() {
        var user = SecurityContextUtil.getUser();
        return user != null ? user.getId() : null;
    }
}
