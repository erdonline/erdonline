package com.erdonline.erd.publicapi;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.dto.ProjectBaseDto;
import com.erdonline.erd.entity.Project;
import com.erdonline.erd.mapper.ProjectMapper;
import com.erdonline.erd.security.ProjectAcl;
import com.erdonline.erd.service.ProjectService;
import com.erdonline.erd.service.impl.ProjectShareServiceImpl;
import com.erdonline.erd.util.Query;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 公开 API 项目：成员 ACL + scope；读写 projectJSON 均走 ADR-0008 清洗。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PublicApiProjectServiceImpl implements PublicApiProjectService {

    private static final int MAX_PAGE_SIZE = 100;

    private final ProjectMapper projectMapper;
    private final ProjectService projectService;
    private final ProjectAcl projectAcl;

    @Override
    public PublicProjectPageView listMine(int page, int size) {
        requireProjectsRead();
        int p = Math.max(page, 1);
        int s = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        String userId = SecurityContextUtil.getAccessUser().getId();

        Map<String, Object> params = new HashMap<>(4);
        params.put("page", p);
        params.put("limit", s);
        params.put("userId", userId);

        Page<ProjectBaseDto> result = projectMapper.projectPage(new Query<>(params), params);
        List<PublicProjectSummaryView> items = result.getRecords().stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
        return PublicProjectPageView.builder()
                .items(items)
                .total(result.getTotal())
                .page(result.getCurrent())
                .size(result.getSize())
                .build();
    }

    @Override
    public PublicProjectDetailView getMine(String projectId) {
        requireProjectsRead();
        Project project = loadMemberProject(projectId);
        return toDetail(project);
    }

    @Override
    public PublicProjectDetailView patchMine(String projectId, PatchPublicProjectRequest request) {
        requireProjectsWrite();
        if (request == null) {
            throw new ValidateException("request body 为空");
        }
        boolean hasName = request.getProjectName() != null;
        boolean hasDesc = request.getDescription() != null;
        boolean hasTags = request.getTags() != null;
        if (!hasName && !hasDesc && !hasTags) {
            throw new ValidateException("至少提供 projectName / description / tags 之一");
        }
        if (hasName && !StringUtils.hasText(request.getProjectName())) {
            throw new ValidateException("projectName 不能为空");
        }

        Project project = loadMemberProject(projectId);
        if (hasName) {
            project.setProjectName(request.getProjectName().trim());
        }
        if (hasDesc) {
            project.setDescription(request.getDescription());
        }
        if (hasTags) {
            project.setTags(request.getTags());
        }

        if (!projectService.updateById(project)) {
            throw new ValidateException("更新项目失败");
        }

        String userId = SecurityContextUtil.getAccessUser().getId();
        log.info("public-api project patched projectId={} userId={} fields=name:{} desc:{} tags:{}",
                projectId, userId, hasName, hasDesc, hasTags);

        Project persisted = projectService.getById(projectId);
        return toDetail(persisted != null ? persisted : project);
    }

    @Override
    public PublicProjectDetailView putProjectJsonMine(
            String projectId, PutPublicProjectJsonRequest request) {
        requireProjectsWrite();
        if (request == null) {
            throw new ValidateException("request body 为空");
        }
        Map<String, Object> rawJson = request.resolveProjectJson();
        if (rawJson == null || rawJson.isEmpty()) {
            throw new ValidateException("projectJSON（或 snapshot）不能为空");
        }

        Project project = loadMemberProject(projectId);
        Map<String, Object> sanitized = ProjectShareServiceImpl.sanitizeProjectJson(rawJson);
        project.setProjectJSON(sanitized);
        ensureModules(project);

        if (!projectService.updateById(project)) {
            throw new ValidateException("更新 projectJSON 失败");
        }

        String userId = SecurityContextUtil.getAccessUser().getId();
        log.info("public-api projectJSON replaced projectId={} userId={}", projectId, userId);

        Project persisted = projectService.getById(projectId);
        return toDetail(persisted != null ? persisted : project);
    }

    private Project loadMemberProject(String projectId) {
        if (!StringUtils.hasText(projectId)) {
            throw new ValidateException("projectId 为空");
        }
        projectAcl.assertMember(projectId);
        Project project = projectService.getById(projectId);
        if (project == null) {
            throw new ValidateException(ApiErrorCode.NOT_FOUND);
        }
        return project;
    }

    private void requireProjectsRead() {
        PatScopes.require(SecurityContextUtil.getAuthorities(), PatScopes.PROJECTS_READ);
    }

    private void requireProjectsWrite() {
        PatScopes.require(SecurityContextUtil.getAuthorities(), PatScopes.PROJECTS_WRITE);
    }

    private PublicProjectSummaryView toSummary(ProjectBaseDto row) {
        return PublicProjectSummaryView.builder()
                .id(row.getId())
                .projectName(row.getProjectName())
                .description(row.getDescription())
                .type(row.getType())
                .tags(row.getTags())
                .updateTime(row.getUpdateTime())
                .build();
    }

    private PublicProjectDetailView toDetail(Project project) {
        return PublicProjectDetailView.builder()
                .id(project.getId())
                .projectName(project.getProjectName())
                .description(project.getDescription())
                .type(project.getType())
                .tags(project.getTags())
                .updateTime(project.getUpdateTime())
                .projectJson(ProjectShareServiceImpl.sanitizeProjectJson(project.getProjectJSON()))
                .build();
    }

    /** Align with ProjectServiceImpl.ensureDefaultProjectJson — modules never null. */
    private static void ensureModules(Project project) {
        Map<String, Object> json = project.getProjectJSON();
        if (json == null) {
            json = new LinkedHashMap<>();
            project.setProjectJSON(json);
        }
        if (!(json.get("modules") instanceof List)) {
            json.put("modules", new ArrayList<>());
        }
    }
}
