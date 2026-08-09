package com.erdonline.erd.catalog;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.erdonline.common.core.api.R;
import com.erdonline.erd.dto.ProjectDto;
import com.erdonline.erd.entity.Project;
import com.erdonline.erd.entity.UserIdentityLink;
import com.erdonline.erd.mapper.UserIdentityLinkMapper;
import com.erdonline.erd.service.ProjectService;
import com.erdonline.erd.service.impl.ProjectShareServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Primary
@RequiredArgsConstructor
public class CatalogServiceImpl implements CatalogService {

    private static final String STATUS_PUBLISHED = "published";

    private final CatalogTemplateMapper templateMapper;
    private final CatalogRatingMapper ratingMapper;
    private final CatalogInstallMapper installMapper;
    private final CatalogSubmissionMapper submissionMapper;
    private final ProjectService projectService;
    private final UserIdentityLinkMapper identityLinkMapper;
    private final CatalogProperties catalogProperties;

    @Override
    public CatalogPageView listTemplates(String q, String tag, String sort, int page, int size, String userId) {
        LambdaQueryWrapper<CatalogTemplate> wrapper = new LambdaQueryWrapper<CatalogTemplate>()
                .eq(CatalogTemplate::getStatus, STATUS_PUBLISHED);
        if (StringUtils.hasText(q)) {
            String like = "%" + q.trim() + "%";
            wrapper.and(w -> w.like(CatalogTemplate::getTitle, like)
                    .or().like(CatalogTemplate::getDescription, like)
                    .or().like(CatalogTemplate::getTags, like));
        }
        if (StringUtils.hasText(tag)) {
            wrapper.like(CatalogTemplate::getTags, tag.trim());
        }
        applySort(wrapper, sort);
        Page<CatalogTemplate> p = templateMapper.selectPage(new Page<>(Math.max(page, 1), clampSize(size)), wrapper);
        CatalogPageView view = new CatalogPageView();
        view.setTotal(p.getTotal());
        view.setRecords(p.getRecords().stream().map(this::toSummary).collect(Collectors.toList()));
        return view;
    }

    @Override
    public CatalogTemplateDetailView getTemplate(String id, String userId) {
        CatalogTemplate t = requirePublishedTemplate(id);
        Integer userRating = null;
        boolean installed = false;
        if (StringUtils.hasText(userId)) {
            CatalogRating rating = ratingMapper.selectOne(new LambdaQueryWrapper<CatalogRating>()
                    .eq(CatalogRating::getTemplateId, t.getId())
                    .eq(CatalogRating::getUserId, userId)
                    .last("LIMIT 1"));
            if (rating != null) {
                userRating = rating.getScore();
            }
            installed = installMapper.selectCount(new LambdaQueryWrapper<CatalogInstall>()
                    .eq(CatalogInstall::getTemplateId, t.getId())
                    .eq(CatalogInstall::getUserId, userId)) > 0;
        }
        return CatalogTemplateDetailView.builder()
                .id(t.getId())
                .slug(t.getSlug())
                .title(t.getTitle())
                .description(t.getDescription())
                .tags(splitTags(t.getTags()))
                .authorHandle(t.getAuthorHandle())
                .authorDisplayName(t.getAuthorDisplayName())
                .installCount(nullSafe(t.getInstallCount()))
                .ratingAverage(averageRating(t))
                .ratingCount(nullSafe(t.getRatingCount()))
                .projectJSON(t.getProjectJson())
                .configJSON(t.getConfigJson())
                .userRating(userRating)
                .installed(installed)
                .createTime(t.getCreateTime())
                .build();
    }

    @Override
    @Transactional
    public R installTemplate(String id, String userId, String username) {
        if (!StringUtils.hasText(userId)) {
            return R.failed("请先登录");
        }
        CatalogTemplate t = requirePublishedTemplate(id);
        String projectName = buildInstallName(t.getTitle(), username);
        ProjectDto dto = new ProjectDto();
        dto.setProjectName(projectName);
        dto.setDescription(StringUtils.hasText(t.getDescription()) ? t.getDescription() : t.getTitle());
        dto.setTags(buildInstallTags(t.getId(), t.getTags()));
        dto.setProjectJSON(prepareInstallJson(t.getProjectJson()));
        if (t.getConfigJson() != null) {
            dto.setConfigJSON(deepCopyMap(t.getConfigJson()));
        }
        R created = projectService.initPersonProject(dto);
        if (created == null || created.invalid()) {
            return created != null ? created : R.failed("安装模板失败");
        }
        String projectId = String.valueOf(created.getData());
        recordInstall(t, userId, projectId);
        CatalogInstallResultView result = CatalogInstallResultView.builder()
                .projectId(projectId)
                .projectName(projectName)
                .templateId(t.getId())
                .build();
        return R.ok(result);
    }

    @Override
    @Transactional
    public R rateTemplate(String id, String userId, int score) {
        if (!StringUtils.hasText(userId)) {
            return R.failed("请先登录");
        }
        if (score < 1 || score > 5) {
            return R.failed("评分须在 1–5 之间");
        }
        CatalogTemplate t = requirePublishedTemplate(id);
        boolean installed = installMapper.selectCount(new LambdaQueryWrapper<CatalogInstall>()
                .eq(CatalogInstall::getTemplateId, t.getId())
                .eq(CatalogInstall::getUserId, userId)) > 0;
        if (!installed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "须先安装模板才能评分");
        }
        CatalogRating existing = ratingMapper.selectOne(new LambdaQueryWrapper<CatalogRating>()
                .eq(CatalogRating::getTemplateId, t.getId())
                .eq(CatalogRating::getUserId, userId)
                .last("LIMIT 1"));
        if (existing != null) {
            int delta = score - existing.getScore();
            existing.setScore(score);
            ratingMapper.updateById(existing);
            if (delta != 0) {
                t.setRatingSum(nullSafe(t.getRatingSum()) + delta);
                templateMapper.updateById(t);
            }
        } else {
            CatalogRating rating = new CatalogRating()
                    .setTemplateId(t.getId())
                    .setUserId(userId)
                    .setScore(score);
            ratingMapper.insert(rating);
            t.setRatingSum(nullSafe(t.getRatingSum()) + score);
            t.setRatingCount(nullSafe(t.getRatingCount()) + 1);
            templateMapper.updateById(t);
        }
        return R.ok(Boolean.TRUE);
    }

    @Override
    public CatalogCreatorView getCreator(String handle) {
        String normalized = handle == null ? "" : handle.trim().toLowerCase(Locale.ROOT);
        if (!StringUtils.hasText(normalized)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "作者不存在");
        }
        List<CatalogTemplate> templates = templateMapper.selectList(new LambdaQueryWrapper<CatalogTemplate>()
                .eq(CatalogTemplate::getStatus, STATUS_PUBLISHED)
                .eq(CatalogTemplate::getAuthorHandle, normalized)
                .orderByDesc(CatalogTemplate::getInstallCount));
        if (templates.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "作者不存在");
        }
        String displayName = templates.get(0).getAuthorDisplayName();
        return CatalogCreatorView.builder()
                .handle(normalized)
                .displayName(displayName)
                .templates(templates.stream().map(this::toSummary).collect(Collectors.toList()))
                .build();
    }

    @Override
    @Transactional
    public R submitTemplate(String userId, String username, SubmitTemplateRequest request) {
        if (!StringUtils.hasText(userId)) {
            return R.failed("请先登录");
        }
        if (request == null || !StringUtils.hasText(request.getProjectId())) {
            return R.failed("projectId 不能为空");
        }
        if (!StringUtils.hasText(request.getTitle())) {
            return R.failed("标题不能为空");
        }
        UserIdentityLink github = identityLinkMapper.selectOne(new LambdaQueryWrapper<UserIdentityLink>()
                .eq(UserIdentityLink::getUserId, userId)
                .eq(UserIdentityLink::getProvider, "github")
                .last("LIMIT 1"));
        if (github == null) {
            return R.failed("发布模板须先绑定 GitHub 账号（账号设置 → 安全）");
        }
        Project project = projectService.getById(request.getProjectId());
        if (project == null) {
            return R.failed("项目不存在");
        }
        if (!isProjectOwner(project, userId, username)) {
            return R.failed("仅项目创建人可发布为模板");
        }
        CatalogSubmission row = new CatalogSubmission()
                .setProjectId(request.getProjectId())
                .setSubmitterUserId(userId)
                .setTitle(request.getTitle().trim())
                .setDescription(request.getDescription())
                .setTags(request.getTags())
                .setStatus("pending");
        submissionMapper.insert(row);
        return R.ok(toSubmissionView(row));
    }

    @Override
    public CatalogPageView listSubmissions(String reviewerUsername, int page, int size) {
        assertMaintainer(reviewerUsername);
        Page<CatalogSubmission> p = submissionMapper.selectPage(
                new Page<>(Math.max(page, 1), clampSize(size)),
                new LambdaQueryWrapper<CatalogSubmission>()
                        .eq(CatalogSubmission::getStatus, "pending")
                        .orderByAsc(CatalogSubmission::getCreateTime));
        CatalogPageView view = new CatalogPageView();
        view.setTotal(p.getTotal());
        view.setRecords(p.getRecords().stream()
                .map(s -> CatalogTemplateSummaryView.builder()
                        .id(s.getId())
                        .title(s.getTitle())
                        .description(s.getDescription())
                        .tags(splitTags(s.getTags()))
                        .createTime(s.getCreateTime())
                        .build())
                .collect(Collectors.toList()));
        return view;
    }

    @Override
    @Transactional
    public R approveSubmission(String submissionId, String reviewerUserId, String reviewerUsername) {
        assertMaintainer(reviewerUsername);
        CatalogSubmission submission = requirePendingSubmission(submissionId);
        Project project = projectService.getById(submission.getProjectId());
        if (project == null) {
            return R.failed("来源项目不存在");
        }
        UserIdentityLink github = identityLinkMapper.selectOne(new LambdaQueryWrapper<UserIdentityLink>()
                .eq(UserIdentityLink::getUserId, submission.getSubmitterUserId())
                .eq(UserIdentityLink::getProvider, "github")
                .last("LIMIT 1"));
        String handle = github != null && StringUtils.hasText(github.getDisplayName())
                ? github.getDisplayName().trim().toLowerCase(Locale.ROOT)
                : "community-" + submission.getSubmitterUserId().substring(0, Math.min(8, submission.getSubmitterUserId().length()));
        String templateId = IdUtil.fastSimpleUUID();
        String slug = slugify(submission.getTitle()) + "-" + templateId.substring(0, 6);
        CatalogTemplate template = new CatalogTemplate()
                .setId(templateId)
                .setSlug(slug)
                .setTitle(submission.getTitle())
                .setDescription(submission.getDescription())
                .setTags(submission.getTags())
                .setAuthorHandle(handle)
                .setAuthorDisplayName(github != null ? github.getDisplayName() : handle)
                .setProjectJson(ProjectShareServiceImpl.sanitizeProjectJson(project.getProjectJSON()))
                .setConfigJson(project.getConfigJSON())
                .setStatus(STATUS_PUBLISHED)
                .setInstallCount(0)
                .setRatingSum(0)
                .setRatingCount(0)
                .setSourceProjectId(project.getId());
        templateMapper.insert(template);
        submission.setStatus("approved");
        submission.setReviewerUserId(reviewerUserId);
        submission.setTemplateId(templateId);
        submissionMapper.updateById(submission);
        return R.ok(toSubmissionView(submission));
    }

    @Override
    @Transactional
    public R rejectSubmission(String submissionId, String reviewerUserId, String reviewerUsername, String note) {
        assertMaintainer(reviewerUsername);
        CatalogSubmission submission = requirePendingSubmission(submissionId);
        submission.setStatus("rejected");
        submission.setReviewerUserId(reviewerUserId);
        submission.setReviewNote(note);
        submissionMapper.updateById(submission);
        return R.ok(toSubmissionView(submission));
    }

    private void recordInstall(CatalogTemplate t, String userId, String projectId) {
        CatalogInstall existing = installMapper.selectOne(new LambdaQueryWrapper<CatalogInstall>()
                .eq(CatalogInstall::getTemplateId, t.getId())
                .eq(CatalogInstall::getUserId, userId)
                .last("LIMIT 1"));
        if (existing == null) {
            installMapper.insert(new CatalogInstall()
                    .setTemplateId(t.getId())
                    .setUserId(userId)
                    .setProjectId(projectId));
            t.setInstallCount(nullSafe(t.getInstallCount()) + 1);
            templateMapper.updateById(t);
        } else if (!StringUtils.hasText(existing.getProjectId())) {
            existing.setProjectId(projectId);
            installMapper.updateById(existing);
        }
    }

    private CatalogTemplate requirePublishedTemplate(String idOrSlug) {
        if (!StringUtils.hasText(idOrSlug)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "模板不存在");
        }
        CatalogTemplate t = templateMapper.selectOne(new LambdaQueryWrapper<CatalogTemplate>()
                .and(w -> w.eq(CatalogTemplate::getId, idOrSlug).or().eq(CatalogTemplate::getSlug, idOrSlug))
                .eq(CatalogTemplate::getStatus, STATUS_PUBLISHED)
                .last("LIMIT 1"));
        if (t == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "模板不存在");
        }
        return t;
    }

    private CatalogSubmission requirePendingSubmission(String id) {
        CatalogSubmission s = submissionMapper.selectById(id);
        if (s == null || !"pending".equals(s.getStatus())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "提交不存在或已处理");
        }
        return s;
    }

    private void assertMaintainer(String username) {
        if (!StringUtils.hasText(username)
                || catalogProperties.getMaintainerUsernames().stream()
                .noneMatch(u -> u.equalsIgnoreCase(username))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "无审核权限");
        }
    }

    private static boolean isProjectOwner(Project project, String userId, String username) {
        String creator = project.getCreator();
        if (creator == null) {
            return false;
        }
        if (creator.equals(userId)) {
            return true;
        }
        return StringUtils.hasText(username) && creator.equals(username);
    }

    private CatalogTemplateSummaryView toSummary(CatalogTemplate t) {
        return CatalogTemplateSummaryView.builder()
                .id(t.getId())
                .slug(t.getSlug())
                .title(t.getTitle())
                .description(t.getDescription())
                .tags(splitTags(t.getTags()))
                .authorHandle(t.getAuthorHandle())
                .authorDisplayName(t.getAuthorDisplayName())
                .installCount(nullSafe(t.getInstallCount()))
                .ratingAverage(averageRating(t))
                .ratingCount(nullSafe(t.getRatingCount()))
                .createTime(t.getCreateTime())
                .build();
    }

    private static CatalogSubmissionView toSubmissionView(CatalogSubmission s) {
        return CatalogSubmissionView.builder()
                .id(s.getId())
                .projectId(s.getProjectId())
                .title(s.getTitle())
                .description(s.getDescription())
                .tags(splitTags(s.getTags()))
                .status(s.getStatus())
                .reviewNote(s.getReviewNote())
                .templateId(s.getTemplateId())
                .createTime(s.getCreateTime())
                .build();
    }

    private static List<String> splitTags(String tags) {
        if (!StringUtils.hasText(tags)) {
            return Collections.emptyList();
        }
        return Arrays.stream(tags.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .collect(Collectors.toList());
    }

    private static double averageRating(CatalogTemplate t) {
        int count = nullSafe(t.getRatingCount());
        if (count <= 0) {
            return 0;
        }
        return Math.round(nullSafe(t.getRatingSum()) * 10.0 / count) / 10.0;
    }

    private static int nullSafe(Integer v) {
        return v == null ? 0 : v;
    }

    private static int clampSize(int size) {
        return Math.min(Math.max(size, 1), 100);
    }

    private static void applySort(LambdaQueryWrapper<CatalogTemplate> wrapper, String sort) {
        if ("rating".equalsIgnoreCase(sort)) {
            wrapper.orderByDesc(CatalogTemplate::getRatingSum);
        } else if ("newest".equalsIgnoreCase(sort)) {
            wrapper.orderByDesc(CatalogTemplate::getCreateTime);
        } else {
            wrapper.orderByDesc(CatalogTemplate::getInstallCount);
        }
    }

    private static String buildInstallName(String title, String username) {
        return title + " (" + (StringUtils.hasText(username) ? username : "我") + ")";
    }

    private static String buildInstallTags(String templateId, String templateTags) {
        List<String> parts = new ArrayList<>();
        parts.add("sourceTemplateId=" + templateId);
        parts.add("catalog-install");
        if (StringUtils.hasText(templateTags)) {
            parts.add(templateTags);
        }
        return String.join(",", parts);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> prepareInstallJson(Map<String, Object> source) {
        Map<String, Object> json = ProjectShareServiceImpl.sanitizeProjectJson(source);
        if (json == null) {
            json = new HashMap<>();
        }
        Object profileObj = json.get("profile");
        if (profileObj instanceof Map) {
            Map<String, Object> profile = (Map<String, Object>) profileObj;
            profile.remove("defaultDataSourceId");
            profile.put("dbs", Collections.emptyList());
        }
        return json;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> deepCopyMap(Map<String, Object> source) {
        Map<String, Object> result = new HashMap<>(source.size() * 2);
        for (Map.Entry<String, Object> entry : source.entrySet()) {
            Object value = entry.getValue();
            if (value instanceof Map) {
                result.put(entry.getKey(), deepCopyMap((Map<String, Object>) value));
            } else if (value instanceof Iterable && !(value instanceof String)) {
                List<Object> list = new ArrayList<>();
                for (Object item : (Iterable<?>) value) {
                    if (item instanceof Map) {
                        list.add(deepCopyMap((Map<String, Object>) item));
                    } else {
                        list.add(item);
                    }
                }
                result.put(entry.getKey(), list);
            } else {
                result.put(entry.getKey(), value);
            }
        }
        return result;
    }

    private static String slugify(String title) {
        String base = title.trim().toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\u4e00-\\u9fff]+", "-")
                .replaceAll("^-+|-+$", "");
        if (!StringUtils.hasText(base)) {
            base = "template";
        }
        return base.length() > 48 ? base.substring(0, 48) : base;
    }
}
