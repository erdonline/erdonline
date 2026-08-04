package com.erdonline.erd.security;

import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.common.core.constant.ProjectConstants;
import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.erd.entity.Project;
import com.erdonline.erd.mapper.ProjectMapper;
import com.erdonline.erd.service.ProjectService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SchemaProbeAccessGuardTest {

    @Mock
    private ProjectAcl projectAcl;

    @Mock
    private ProjectMapper projectMapper;

    @Mock
    private ProjectService projectService;

    private SchemaProbeAccessGuard guard;

    @BeforeEach
    void setUp() {
        guard = new SchemaProbeAccessGuard(projectAcl, projectMapper, projectService);
        bindUser("u1", "alice");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private static void bindUser(String id, String username) {
        MartinUser user = new MartinUser(
                id, null, new HashSet<>(), "0", username, "N/A",
                true, true, true, true, List.of());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, "n/a", List.of()));
    }

    @Test
    void missingProjectId_forbidden() {
        ValidateException ex = assertThrows(ValidateException.class, () -> guard.assertCanProbe(new HashMap<>()));
        assertEquals(ApiErrorCode.FORBIDDEN.getCode(), ex.getStatus());
    }

    @Test
    void nonMember_forbidden() {
        Map<String, Object> params = Map.of("projectId", "p-share");
        doThrow(new ValidateException(ApiErrorCode.FORBIDDEN)).when(projectAcl).assertMember("p-share");

        ValidateException ex = assertThrows(ValidateException.class, () -> guard.assertCanProbe(params));
        assertEquals(ApiErrorCode.FORBIDDEN.getCode(), ex.getStatus());
    }

    @Test
    void personProject_memberAllowed() {
        Map<String, Object> params = Map.of("projectId", "p1");
        Project person = new Project();
        person.setType(ProjectConstants.PERSON_PROJECT_FLAG);
        when(projectMapper.selectById("p1")).thenReturn(person);

        guard.assertCanProbe(params);
    }

    @Test
    void groupProject_withoutReversePermission_forbidden() {
        Map<String, Object> params = Map.of("projectId", "g1");
        Project group = new Project();
        group.setType(ProjectConstants.GROUP_PROJECT_FLAG);
        when(projectMapper.selectById("g1")).thenReturn(group);
        when(projectService.currentRolePermission("g1")).thenReturn(R.ok(Map.of("permission", List.of("erd_hisProject_load"))));

        ValidateException ex = assertThrows(ValidateException.class, () -> guard.assertCanProbe(params));
        assertEquals(ApiErrorCode.FORBIDDEN.getCode(), ex.getStatus());
    }

    @Test
    void groupProject_withReversePermission_allowed() {
        Map<String, Object> params = Map.of("projectId", "g1");
        Project group = new Project();
        group.setType(ProjectConstants.GROUP_PROJECT_FLAG);
        when(projectMapper.selectById("g1")).thenReturn(group);
        when(projectService.currentRolePermission("g1")).thenReturn(R.ok(Map.of(
                "permission", List.of(SchemaProbeAccessGuard.PERM_SCHEMA_PROBE))));

        guard.assertCanProbe(params);
    }
}
