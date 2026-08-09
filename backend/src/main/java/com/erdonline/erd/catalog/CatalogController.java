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
            @RequestParam(required = false) String origin,
            @RequestParam(defaultValue = "installs") String sort,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        String userId = currentUserIdOrNull();
        return R.ok(catalogService.listTemplates(q, tag, origin, sort, page, size, userId));
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
    @Operation(summary = "提交发布为模板（须为项目创建人；维护者审核）")
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

    @GetMapping("/templates/{id}/comments")
    @Operation(summary = "评论列表（可见评论）")
    public R<CatalogCommentPageView> listComments(
            @PathVariable String id,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return R.ok(catalogService.listComments(id, currentUserIdOrNull(), page, size));
    }

    @PostMapping("/templates/{id}/comments")
    @Operation(summary = "发表评论（须已安装；限频）")
    public R addComment(@PathVariable String id, @Valid @RequestBody AddCommentRequest request) {
        var user = SecurityContextUtil.getAccessUser();
        return catalogService.addComment(id, user.getId(), user.getUsername(), request.getBody());
    }

    @PostMapping("/templates/{id}/comments/{commentId}/report")
    @Operation(summary = "举报评论（达阈值自动隐藏待审）")
    public R reportComment(
            @PathVariable String id,
            @PathVariable String commentId,
            @RequestBody(required = false) ReportCommentRequest request) {
        var user = SecurityContextUtil.getAccessUser();
        String reason = request != null ? request.getReason() : null;
        return catalogService.reportComment(id, commentId, user.getId(), reason);
    }

    @PostMapping("/templates/{id}/comments-enabled")
    @Operation(summary = "作者/维护者开关评论")
    public R toggleComments(@PathVariable String id, @Valid @RequestBody ToggleCommentsRequest request) {
        var user = SecurityContextUtil.getAccessUser();
        return catalogService.toggleComments(id, user.getId(), user.getUsername(), request.getEnabled());
    }

    @PostMapping("/templates/{id}/restrict-user")
    @Operation(summary = "作者/维护者限制评论者")
    public R restrictUser(@PathVariable String id, @Valid @RequestBody RestrictUserRequest request) {
        var user = SecurityContextUtil.getAccessUser();
        return catalogService.restrictCommenter(id, user.getId(), user.getUsername(), request.getUserId());
    }

    private static String currentUserIdOrNull() {
        var user = SecurityContextUtil.getUser();
        return user != null ? user.getId() : null;
    }
}
