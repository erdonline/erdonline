package com.erdonline.erd.security;

import cn.hutool.core.util.StrUtil;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.mapper.ProjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Project tenancy: membership via {@code project_user} (person + group).
 */
@Component
@RequiredArgsConstructor
public class ProjectAcl {

    private final ProjectMapper projectMapper;

    public boolean isMember(String projectId, String userId) {
        if (StrUtil.isBlank(projectId) || StrUtil.isBlank(userId)) {
            return false;
        }
        Integer count = projectMapper.countProjectMember(projectId, userId);
        return count != null && count > 0;
    }

    /** Throws when current user is not in {@code project_user} for the project. */
    public void assertMember(String projectId) {
        if (StrUtil.isBlank(projectId)) {
            throw new ValidateException("projectId 为空");
        }
        String userId = SecurityContextUtil.getAccessUser().getId();
        if (!isMember(projectId, userId)) {
            throw new ValidateException(ApiErrorCode.FORBIDDEN);
        }
    }
}
