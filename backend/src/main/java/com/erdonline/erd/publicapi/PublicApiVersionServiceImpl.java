package com.erdonline.erd.publicapi;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.entity.DbChange;
import com.erdonline.erd.security.ProjectAcl;
import com.erdonline.erd.service.DbChangeService;
import com.erdonline.erd.service.impl.ProjectShareServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 公开 API 版本只读：成员 ACL + {@code versions:read}；详情 projectJSON 走 ADR-0008 清洗。
 */
@Service
@RequiredArgsConstructor
public class PublicApiVersionServiceImpl implements PublicApiVersionService {

    private static final int MAX_PAGE_SIZE = 100;

    private final DbChangeService dbChangeService;
    private final ProjectAcl projectAcl;

    @Override
    public PublicVersionPageView listMine(String projectId, String dbKey, int page, int size) {
        requireVersionsRead();
        if (!StringUtils.hasText(projectId)) {
            throw new ValidateException("projectId 为空");
        }
        projectAcl.assertMember(projectId);

        int p = Math.max(page, 1);
        int s = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);

        QueryWrapper<DbChange> wrapper = new QueryWrapper<>();
        wrapper.eq("project_id", projectId);
        if (StringUtils.hasText(dbKey)) {
            wrapper.eq("db_key", dbKey);
        }
        // align with HisProject loadHistory: newest version first; omit heavy JSON blobs
        wrapper.select(
                "id", "project_id", "db_key", "version", "version_date", "version_desc",
                "tag", "base_version", "creator", "create_time");
        wrapper.orderByDesc("create_time");
        wrapper.orderByDesc("version");

        Page<DbChange> result = dbChangeService.page(new Page<>(p, s), wrapper);
        List<PublicVersionSummaryView> items = result.getRecords().stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
        return PublicVersionPageView.builder()
                .items(items)
                .total(result.getTotal())
                .page(result.getCurrent())
                .size(result.getSize())
                .build();
    }

    @Override
    public PublicVersionDetailView getMine(String projectId, String versionId) {
        requireVersionsRead();
        if (!StringUtils.hasText(projectId)) {
            throw new ValidateException("projectId 为空");
        }
        if (!StringUtils.hasText(versionId)) {
            throw new ValidateException("versionId 为空");
        }
        projectAcl.assertMember(projectId);

        DbChange row = dbChangeService.getById(versionId);
        if (row == null || !projectId.equals(row.getProjectId())) {
            throw new ValidateException(ApiErrorCode.NOT_FOUND);
        }
        return toDetail(row);
    }

    private void requireVersionsRead() {
        PatScopes.require(SecurityContextUtil.getAuthorities(), PatScopes.VERSIONS_READ);
    }

    private PublicVersionSummaryView toSummary(DbChange row) {
        return PublicVersionSummaryView.builder()
                .id(row.getId())
                .projectId(row.getProjectId())
                .dbKey(row.getDbKey())
                .version(row.getVersion())
                .versionDate(row.getVersionDate())
                .versionDesc(row.getVersionDesc())
                .tag(row.getTag())
                .baseVersion(row.getBaseVersion())
                .creator(row.getCreator())
                .createTime(row.getCreateTime())
                .build();
    }

    private PublicVersionDetailView toDetail(DbChange row) {
        return PublicVersionDetailView.builder()
                .id(row.getId())
                .projectId(row.getProjectId())
                .dbKey(row.getDbKey())
                .version(row.getVersion())
                .versionDate(row.getVersionDate())
                .versionDesc(row.getVersionDesc())
                .tag(row.getTag())
                .baseVersion(row.getBaseVersion())
                .creator(row.getCreator())
                .createTime(row.getCreateTime())
                .changes(row.getChanges())
                .projectJson(ProjectShareServiceImpl.sanitizeProjectJson(row.getProjectJSON()))
                .build();
    }
}
