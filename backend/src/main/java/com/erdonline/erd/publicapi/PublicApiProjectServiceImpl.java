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
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 公开 API 项目只读：成员 ACL + {@code projects:read}；projectJSON 走 ADR-0008 清洗。
 */
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
        if (!StringUtils.hasText(projectId)) {
            throw new ValidateException("projectId 为空");
        }
        projectAcl.assertMember(projectId);
        Project project = projectService.getById(projectId);
        if (project == null) {
            throw new ValidateException(ApiErrorCode.NOT_FOUND);
        }
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

    private void requireProjectsRead() {
        PatScopes.require(SecurityContextUtil.getAuthorities(), PatScopes.PROJECTS_READ);
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
}
