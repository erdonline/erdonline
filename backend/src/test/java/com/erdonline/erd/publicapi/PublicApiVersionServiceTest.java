package com.erdonline.erd.publicapi;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.erdonline.common.core.api.R;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.erd.entity.DbChange;
import com.erdonline.erd.security.VersionDbKeyGuard;
import com.erdonline.erd.service.DbChangeService;
import com.erdonline.erd.service.impl.ProjectShareServiceImpl;
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
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PublicApiVersionServiceTest {

    @Mock
    private DbChangeService dbChangeService;
    @Mock
    private VersionDbKeyGuard dbKeyGuard;

    private PublicApiVersionServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PublicApiVersionServiceImpl(dbChangeService, dbKeyGuard);
        // 本文件聚焦成员/scope ACL 与 projectJSON 清洗；dbKey 归属校验专项见 VersionDbKeyGuardTest。
        lenient().when(dbKeyGuard.assertDbKeyBelongsToCaller(anyString(), anyString()))
                .thenAnswer(inv -> inv.getArgument(1));
    }

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void listMine_requiresVersionsReadScope() {
        bindUser("u1", "alice", Set.of(PatScopes.PROJECTS_READ));
        ValidateException ex = assertThrows(ValidateException.class,
                () -> service.listMine("p1", null, 1, 20));
        assertEquals(ApiErrorCode.FORBIDDEN.getCode(), ex.getStatus());
    }

    @Test
    void listMine_passesAclAndReturnsPage() {
        bindUser("u1", "alice", PatScopes.DEFAULT_READ);
        DbChange row = new DbChange();
        row.setId("v1");
        row.setProjectId("p1");
        row.setVersion("1.0.0");
        Page<DbChange> page = new Page<>(1, 20);
        page.setRecords(List.of(row));
        page.setTotal(1);
        when(dbChangeService.page(any(Page.class), any(QueryWrapper.class))).thenReturn(page);

        PublicVersionPageView view = service.listMine("p1", "default", 1, 20);

        verify(dbKeyGuard).assertMember("p1");
        assertEquals(1, view.getTotal());
        assertEquals("v1", view.getItems().get(0).getId());
        assertEquals("1.0.0", view.getItems().get(0).getVersion());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<QueryWrapper<DbChange>> wrapperCap = ArgumentCaptor.forClass(QueryWrapper.class);
        verify(dbChangeService).page(any(Page.class), wrapperCap.capture());
        assertNotNull(wrapperCap.getValue());
    }

    @Test
    void getMine_requiresMemberAndSanitizesDbs() {
        bindUser("u1", "alice", PatScopes.DEFAULT_READ);
        DbChange row = new DbChange();
        row.setId("v1");
        row.setProjectId("p1");
        row.setVersion("1.0.0");
        Map<String, Object> profile = new HashMap<>();
        profile.put("dbs", List.of(Map.of("url", "secret")));
        profile.put("defaultDataSourceId", "ds-1");
        Map<String, Object> json = new HashMap<>();
        json.put("profile", profile);
        json.put("modules", List.of());
        row.setProjectJSON(json);
        when(dbChangeService.getById("v1")).thenReturn(row);

        PublicVersionDetailView view = service.getMine("p1", "v1");

        verify(dbKeyGuard).assertMember("p1");
        assertEquals("v1", view.getId());
        @SuppressWarnings("unchecked")
        Map<String, Object> outProfile = (Map<String, Object>) view.getProjectJson().get("profile");
        assertTrue(((List<?>) outProfile.get("dbs")).isEmpty());
        assertEquals("ds-1", outProfile.get("defaultDataSourceId"));
        assertEquals(1, ((List<?>) profile.get("dbs")).size());
    }

    @Test
    void getMine_notFoundWhenVersionBelongsToOtherProject() {
        bindUser("u1", "alice", PatScopes.DEFAULT_READ);
        DbChange row = new DbChange();
        row.setId("v1");
        row.setProjectId("p-other");
        when(dbChangeService.getById("v1")).thenReturn(row);

        ValidateException ex = assertThrows(ValidateException.class, () -> service.getMine("p1", "v1"));
        assertEquals(ApiErrorCode.NOT_FOUND.getCode(), ex.getStatus());
    }

    @Test
    void getMine_forbiddenWhenNotMember() {
        bindUser("u1", "alice", PatScopes.DEFAULT_READ);
        doThrow(new ValidateException(ApiErrorCode.FORBIDDEN)).when(dbKeyGuard).assertMember("p-other");

        ValidateException ex = assertThrows(ValidateException.class, () -> service.getMine("p-other", "v1"));
        assertEquals(ApiErrorCode.FORBIDDEN.getCode(), ex.getStatus());
    }

    @Test
    void createMine_requiresVersionsWriteScope() {
        bindUser("u1", "alice", PatScopes.DEFAULT_READ);
        CreatePublicVersionRequest req = minimalCreateRequest();
        ValidateException ex = assertThrows(ValidateException.class,
                () -> service.createMine("p1", req));
        assertEquals(ApiErrorCode.FORBIDDEN.getCode(), ex.getStatus());
        verify(dbChangeService, never()).saveVersion(any());
    }

    @Test
    void createMine_requiresMember() {
        bindUser("u1", "alice", Set.of(PatScopes.VERSIONS_WRITE));
        doThrow(new ValidateException(ApiErrorCode.FORBIDDEN)).when(dbKeyGuard).assertMember("p1");
        ValidateException ex = assertThrows(ValidateException.class,
                () -> service.createMine("p1", minimalCreateRequest()));
        assertEquals(ApiErrorCode.FORBIDDEN.getCode(), ex.getStatus());
    }

    @Test
    void createMine_sanitizesDbsAndPersistsInsertOnly() {
        bindUser("u1", "alice", Set.of(PatScopes.VERSIONS_WRITE));
        CreatePublicVersionRequest req = minimalCreateRequest();
        Map<String, Object> profile = new HashMap<>();
        profile.put("dbs", List.of(Map.of("url", "jdbc:secret")));
        profile.put("defaultDataSourceId", "ds-1");
        Map<String, Object> json = new HashMap<>();
        json.put("profile", profile);
        json.put("modules", List.of());
        req.setProjectJSON(json);

        doAnswer(invocation -> {
            DbChange arg = invocation.getArgument(0);
            assertNull(arg.getId());
            arg.setId("new-v1");
            @SuppressWarnings("unchecked")
            Map<String, Object> savedProfile = (Map<String, Object>) arg.getProjectJSON().get("profile");
            assertTrue(((List<?>) savedProfile.get("dbs")).isEmpty());
            assertEquals("ds-1", savedProfile.get("defaultDataSourceId"));
            return R.ok("保存成功");
        }).when(dbChangeService).saveVersion(any(DbChange.class));

        DbChange persisted = new DbChange();
        persisted.setId("new-v1");
        persisted.setProjectId("p1");
        persisted.setVersion("9.9.9");
        persisted.setProjectJSON(ProjectShareServiceImpl.sanitizeProjectJson(json));
        when(dbChangeService.getById("new-v1")).thenReturn(persisted);

        PublicVersionDetailView view = service.createMine("p1", req);

        verify(dbKeyGuard).assertMember("p1");
        assertEquals("new-v1", view.getId());
        @SuppressWarnings("unchecked")
        Map<String, Object> outProfile = (Map<String, Object>) view.getProjectJson().get("profile");
        assertTrue(((List<?>) outProfile.get("dbs")).isEmpty());
        // source must not be mutated
        assertEquals(1, ((List<?>) profile.get("dbs")).size());
    }

    @Test
    void createMine_rejectsEmptyProjectJson() {
        bindUser("u1", "alice", Set.of(PatScopes.VERSIONS_WRITE));
        CreatePublicVersionRequest req = minimalCreateRequest();
        req.setProjectJSON(null);
        assertThrows(ValidateException.class, () -> service.createMine("p1", req));
        verify(dbChangeService, never()).saveVersion(any());
    }

    private static CreatePublicVersionRequest minimalCreateRequest() {
        CreatePublicVersionRequest req = new CreatePublicVersionRequest();
        req.setDbKey("defaultDB");
        req.setVersion("9.9.9");
        req.setVersionDesc("api dogfood");
        Map<String, Object> json = new HashMap<>();
        json.put("modules", List.of());
        req.setProjectJSON(json);
        return req;
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
