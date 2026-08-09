package com.erdonline.erd.publicapi;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.entity.DbChange;
import com.erdonline.erd.security.VersionDbKeyGuard;
import com.erdonline.erd.service.DbChangeService;
import com.erdonline.erd.service.impl.ProjectShareServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 公开 API 版本：成员 ACL + scope；详情/写入 projectJSON 走 ADR-0008 清洗。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PublicApiVersionServiceImpl implements PublicApiVersionService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final DateTimeFormatter VERSION_DATE_FMT =
            DateTimeFormatter.ofPattern("yyyy/M/d H:m:s");

    private final DbChangeService dbChangeService;
    private final VersionDbKeyGuard dbKeyGuard;

    @Override
    public PublicVersionPageView listMine(String projectId, String dbKey, int page, int size) {
        requireVersionsRead();
        if (!StringUtils.hasText(projectId)) {
            throw new ValidateException("projectId 为空");
        }
        dbKeyGuard.assertMember(projectId);

        int p = Math.max(page, 1);
        int s = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);

        QueryWrapper<DbChange> wrapper = new QueryWrapper<>();
        wrapper.eq("project_id", projectId);
        if (StringUtils.hasText(dbKey)) {
            wrapper.eq("db_key", dbKeyGuard.assertDbKeyBelongsToCaller(projectId, dbKey));
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
        dbKeyGuard.assertMember(projectId);

        DbChange row = dbChangeService.getById(versionId);
        if (row == null || !projectId.equals(row.getProjectId())) {
            throw new ValidateException(ApiErrorCode.NOT_FOUND);
        }
        return toDetail(row);
    }

    @Override
    public PublicVersionDetailView createMine(String projectId, CreatePublicVersionRequest request) {
        requireVersionsWrite();
        if (!StringUtils.hasText(projectId)) {
            throw new ValidateException("projectId 为空");
        }
        if (request == null) {
            throw new ValidateException("request body 为空");
        }
        dbKeyGuard.assertMember(projectId);

        Map<String, Object> rawJson = request.resolveProjectJson();
        if (rawJson == null || rawJson.isEmpty()) {
            throw new ValidateException("projectJSON（或 snapshot）不能为空");
        }

        Map<String, Object> sanitized = ProjectShareServiceImpl.sanitizeProjectJson(rawJson);
        DbChange row = new DbChange();
        // Always insert — never accept client id (blocks update/hijack via public API)
        row.setId(null);
        row.setProjectId(projectId);
        row.setDbKey(dbKeyGuard.assertDbKeyBelongsToCaller(projectId, request.getDbKey().trim()));
        row.setVersion(request.getVersion().trim());
        row.setVersionDesc(request.getVersionDesc().trim());
        row.setTag(request.getTag());
        row.setBaseVersion(Boolean.TRUE.equals(request.getBaseVersion()));
        row.setChanges(request.getChanges() != null ? request.getChanges() : Collections.emptyList());
        row.setProjectJSON(sanitized);
        if (StringUtils.hasText(request.getVersionDate())) {
            row.setVersionDate(request.getVersionDate().trim());
        } else {
            row.setVersionDate(LocalDateTime.now().format(VERSION_DATE_FMT));
        }

        R<?> saved = dbChangeService.saveVersion(row);
        if (saved == null || saved.invalid()) {
            throw new ValidateException(saved != null && StringUtils.hasText(saved.getMsg())
                    ? saved.getMsg()
                    : "保存版本失败");
        }
        if (!StringUtils.hasText(row.getId())) {
            throw new ValidateException("保存版本失败：未生成 id");
        }

        String userId = SecurityContextUtil.getAccessUser().getId();
        log.info("public-api version created projectId={} versionId={} version={} userId={}",
                projectId, row.getId(), row.getVersion(), userId);

        DbChange persisted = dbChangeService.getById(row.getId());
        if (persisted == null) {
            return toDetail(row);
        }
        return toDetail(persisted);
    }

    private void requireVersionsRead() {
        PatScopes.require(SecurityContextUtil.getAuthorities(), PatScopes.VERSIONS_READ);
    }

    private void requireVersionsWrite() {
        PatScopes.require(SecurityContextUtil.getAuthorities(), PatScopes.VERSIONS_WRITE);
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
