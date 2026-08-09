package com.erdonline.erd.security;

import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.erd.entity.DataSources;
import com.erdonline.erd.entity.Project;
import com.erdonline.erd.mapper.DataSourcesMapper;
import com.erdonline.erd.service.ProjectService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.HashSet;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link VersionDbKeyGuard}：db_key 归属 = 项目成员 + （快照哨兵 或 调用者名下的 dataSourceId）。
 * 覆盖 db_key 安全审计的核心断言矩阵：非成员 403 / 快照放行 / 自有数据源放行 / 他人数据源 403。
 */
@ExtendWith(MockitoExtension.class)
class VersionDbKeyGuardTest {

    @Mock
    private ProjectAcl projectAcl;

    @Mock
    private ProjectService projectService;

    @Mock
    private DataSourcesMapper dataSourcesMapper;

    private VersionDbKeyGuard guard;

    @BeforeEach
    void setUp() {
        guard = new VersionDbKeyGuard(projectAcl, projectService, dataSourcesMapper);
        bindUser("user-a", "alice");
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
    void nonMember_forbidden_beforeTouchingDbKey() {
        doThrow(new ValidateException(ApiErrorCode.FORBIDDEN)).when(projectAcl).assertMember("p-foreign");

        ValidateException ex = assertThrows(ValidateException.class,
                () -> guard.assertDbKeyBelongsToCaller("p-foreign", "any-db-key"));
        assertEquals(ApiErrorCode.FORBIDDEN.getCode(), ex.getStatus());
    }

    @Test
    void member_snapshotSentinel_allowed() {
        String canonical = guard.assertDbKeyBelongsToCaller("p1", "__erd_snapshot__");
        assertEquals("__erd_snapshot__", canonical);
        verify(projectAcl).assertMember("p1");
    }

    @Test
    void member_legacySnapshotAlias_resolvedAndAllowed() {
        String canonical = guard.assertDbKeyBelongsToCaller("p1", "SNAPSHOT");
        assertEquals("__erd_snapshot__", canonical);
    }

    @Test
    void member_ownDataSourceId_allowed() {
        DataSources owned = new DataSources();
        owned.setId("ds-a");
        owned.setCreator("alice");
        when(dataSourcesMapper.selectById("ds-a")).thenReturn(owned);

        String canonical = guard.assertDbKeyBelongsToCaller("p1", "ds-a");
        assertEquals("ds-a", canonical);
    }

    @Test
    void member_foreignDataSourceId_forbidden() {
        DataSources ownedByBob = new DataSources();
        ownedByBob.setId("ds-b");
        ownedByBob.setCreator("bob");
        when(dataSourcesMapper.selectById("ds-b")).thenReturn(ownedByBob);

        ValidateException ex = assertThrows(ValidateException.class,
                () -> guard.assertDbKeyBelongsToCaller("p1", "ds-b"));
        assertEquals(ApiErrorCode.FORBIDDEN.getCode(), ex.getStatus());
    }

    @Test
    void member_missingDataSourceId_forbidden() {
        when(dataSourcesMapper.selectById("ds-missing")).thenReturn(null);

        assertThrows(ValidateException.class,
                () -> guard.assertDbKeyBelongsToCaller("p1", "ds-missing"));
    }

    @Test
    void member_blankDbKey_passesThroughWithoutOwnershipLookup() {
        String canonical = guard.assertDbKeyBelongsToCaller("p1", null);
        assertNull(canonical);
        verify(projectAcl).assertMember("p1");
    }

    @Test
    void resolveDbKey_doesNotAssertMembership() {
        String canonical = guard.resolveDbKey("p1", "SNAPSHOT");
        assertEquals("__erd_snapshot__", canonical);
        // 纯归一化：不应触发成员校验（用于已在别处完成鉴权的场景，如 diff/canonicalize-only 路径）。
        verify(projectAcl, org.mockito.Mockito.never()).assertMember(anyString());
    }
}
