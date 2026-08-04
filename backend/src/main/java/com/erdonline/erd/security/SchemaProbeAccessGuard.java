package com.erdonline.erd.security;

import cn.hutool.core.util.StrUtil;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.common.core.constant.ProjectConstants;
import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.entity.Project;
import com.erdonline.erd.mapper.ProjectMapper;
import com.erdonline.erd.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * B-layer probe ACL (ADR-0022 #11): share guests / non-members / read-only roles fail closed.
 */
@Component
@RequiredArgsConstructor
public class SchemaProbeAccessGuard {

    /** Same capability gate as FE {@code canErdConnectorDbreverseparse}. */
    public static final String PERM_SCHEMA_PROBE = "erd_connector_dbReverseParse";

    private final ProjectAcl projectAcl;
    private final ProjectMapper projectMapper;
    private final ProjectService projectService;

    @SuppressWarnings("rawtypes")
    public void assertCanProbe(Map params) {
        SecurityContextUtil.getAccessUser();
        String projectId = extractProjectId(params);
        if (StrUtil.isBlank(projectId)) {
            throw aclDenied("缺少 projectId，无法探测实库");
        }
        try {
            projectAcl.assertMember(projectId);
        } catch (ValidateException ex) {
            throw aclDenied("非项目成员无法探测实库（分享访客只读）");
        }
        Project project = projectMapper.selectById(projectId);
        if (project != null && ProjectConstants.GROUP_PROJECT_FLAG.equals(project.getType())) {
            assertGroupProbePermission(projectId);
        }
    }

    private void assertGroupProbePermission(String projectId) {
        R rolePerm = projectService.currentRolePermission(projectId);
        if (rolePerm == null || !rolePerm.valid() || !(rolePerm.getData() instanceof Map<?, ?> data)) {
            throw aclDenied("无法验证项目实库探测权限");
        }
        Object permissionObj = data.get("permission");
        if (!(permissionObj instanceof Collection<?> permissions)) {
            throw aclDenied("当前角色无实库探测权限");
        }
        boolean allowed = permissions.stream().anyMatch(PERM_SCHEMA_PROBE::equals);
        if (!allowed) {
            throw aclDenied("当前角色无实库探测权限");
        }
    }

    @SuppressWarnings("rawtypes")
    private static String extractProjectId(Map params) {
        if (params == null || params.get("projectId") == null) {
            return null;
        }
        String id = String.valueOf(params.get("projectId")).trim();
        return StrUtil.isBlank(id) || "null".equalsIgnoreCase(id) ? null : id;
    }

    private static ValidateException aclDenied(String message) {
        return new ValidateException(ApiErrorCode.FORBIDDEN.getCode(), message);
    }
}
