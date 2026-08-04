package com.erdonline.erd.publicapi;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.erd.dto.ProjectBaseDto;
import com.erdonline.erd.entity.Project;
import com.erdonline.erd.mapper.ProjectMapper;
import com.erdonline.erd.security.ProjectAcl;
import com.erdonline.erd.service.ProjectService;
import com.erdonline.erd.util.Query;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PublicApiProjectServiceTest {

    @Mock
    private ProjectMapper projectMapper;
    @Mock
    private ProjectService projectService;
    @Mock
    private ProjectAcl projectAcl;

    private PublicApiProjectServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PublicApiProjectServiceImpl(projectMapper, projectService, projectAcl);
    }

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void listMine_requiresProjectsReadScope() {
        bindUser("u1", "alice", Set.of(PatScopes.VERSIONS_READ));
        ValidateException ex = assertThrows(ValidateException.class, () -> service.listMine(1, 20));
        assertEquals(ApiErrorCode.FORBIDDEN.getCode(), ex.getStatus());
    }

    @Test
    void listMine_passesUserIdAndReturnsPage() {
        bindUser("u1", "alice", PatScopes.DEFAULT_READ);
        ProjectBaseDto row = new ProjectBaseDto();
        row.setId("p1");
        row.setProjectName("Demo");
        Page<ProjectBaseDto> page = new Page<>(1, 20);
        page.setRecords(List.of(row));
        page.setTotal(1);
        when(projectMapper.projectPage(any(Query.class), any(Map.class))).thenReturn(page);

        PublicProjectPageView view = service.listMine(1, 20);

        assertEquals(1, view.getTotal());
        assertEquals(1, view.getItems().size());
        assertEquals("p1", view.getItems().get(0).getId());
        assertEquals("Demo", view.getItems().get(0).getProjectName());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> paramsCap = ArgumentCaptor.forClass(Map.class);
        verify(projectMapper).projectPage(any(Query.class), paramsCap.capture());
        assertEquals("u1", paramsCap.getValue().get("userId"));
    }

    @Test
    void getMine_requiresMemberAclAndSanitizesDbs() {
        bindUser("u1", "alice", PatScopes.DEFAULT_READ);
        Project project = new Project();
        project.setId("p1");
        project.setProjectName("Demo");
        Map<String, Object> profile = new HashMap<>();
        profile.put("dbs", List.of(Map.of("url", "secret")));
        profile.put("defaultDataSourceId", "ds-1");
        Map<String, Object> json = new HashMap<>();
        json.put("profile", profile);
        json.put("modules", List.of());
        project.setProjectJSON(json);
        when(projectService.getById("p1")).thenReturn(project);

        PublicProjectDetailView view = service.getMine("p1");

        verify(projectAcl).assertMember("p1");
        assertEquals("p1", view.getId());
        assertNotNull(view.getProjectJson());
        @SuppressWarnings("unchecked")
        Map<String, Object> outProfile = (Map<String, Object>) view.getProjectJson().get("profile");
        assertTrue(((List<?>) outProfile.get("dbs")).isEmpty());
        assertEquals("ds-1", outProfile.get("defaultDataSourceId"));
        assertEquals(1, ((List<?>) profile.get("dbs")).size());
    }

    @Test
    void getMine_forbiddenWhenNotMember() {
        bindUser("u1", "alice", PatScopes.DEFAULT_READ);
        doThrow(new ValidateException(ApiErrorCode.FORBIDDEN)).when(projectAcl).assertMember("p-other");

        ValidateException ex = assertThrows(ValidateException.class, () -> service.getMine("p-other"));
        assertEquals(ApiErrorCode.FORBIDDEN.getCode(), ex.getStatus());
    }

    private static void bindUser(String id, String username, Set<String> scopes) {
        List<SimpleGrantedAuthority> authorities = scopes.stream()
                .map(SimpleGrantedAuthority::new)
                .toList();
        MartinUser user = new MartinUser(
                id, null, new HashSet<>(), "0", username, "N/A",
                true, true, true, true, authorities);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, "n/a", authorities));
    }
}
