package com.erdonline.erd.security;

import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.erd.entity.DataSources;
import com.erdonline.erd.mapper.DataSourcesMapper;
import com.erdonline.erd.mapper.ProjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectAndDataSourceAclTest {

    @Mock
    private ProjectMapper projectMapper;

    @Mock
    private DataSourcesMapper dataSourcesMapper;

    private ProjectAcl projectAcl;
    private DataSourceAcl dataSourceAcl;

    @BeforeEach
    void setUp() {
        projectAcl = new ProjectAcl(projectMapper);
        dataSourceAcl = new DataSourceAcl(dataSourcesMapper);
    }

    @Test
    void resourceOwnership_matchesUsernameOrUserId() {
        assertTrue(ResourceOwnership.matchesCreator("alice", "u1", "alice"));
        assertTrue(ResourceOwnership.matchesCreator("u1", "u1", "alice"));
        assertFalse(ResourceOwnership.matchesCreator("bob", "u1", "alice"));
        assertFalse(ResourceOwnership.matchesCreator(null, "u1", "alice"));
        assertFalse(ResourceOwnership.matchesCreator("  ", "u1", "alice"));
    }

    @Test
    void projectAcl_isMember_trueWhenCountPositive() {
        when(projectMapper.countProjectMember("p-b", "user-a")).thenReturn(0);
        when(projectMapper.countProjectMember("p-a", "user-a")).thenReturn(1);

        assertFalse(projectAcl.isMember("p-b", "user-a"));
        assertTrue(projectAcl.isMember("p-a", "user-a"));
        assertFalse(projectAcl.isMember("", "user-a"));
        assertFalse(projectAcl.isMember("p-a", ""));
    }

    @Test
    void dataSourceAcl_userA_cannotReadUserB() {
        DataSources ownedByB = new DataSources();
        ownedByB.setId("ds-b");
        ownedByB.setCreator("bob");
        when(dataSourcesMapper.selectById("ds-b")).thenReturn(ownedByB);

        ValidateException ex = assertThrows(ValidateException.class,
                () -> dataSourceAcl.requireOwned("ds-b", "user-a", "alice"));
        assertEquals(ApiErrorCode.FORBIDDEN.getCode(), ex.getStatus());
        assertEquals(ApiErrorCode.FORBIDDEN.getMsg(), ex.getMessage());
    }

    @Test
    void dataSourceAcl_ownerCanRead() {
        DataSources owned = new DataSources();
        owned.setId("ds-a");
        owned.setCreator("alice");
        when(dataSourcesMapper.selectById("ds-a")).thenReturn(owned);

        assertSame(owned, dataSourceAcl.requireOwned("ds-a", "user-a", "alice"));
        verify(dataSourcesMapper).selectById("ds-a");
    }

    @Test
    void dataSourceAcl_missingId_forbidden() {
        when(dataSourcesMapper.selectById("missing")).thenReturn(null);
        assertThrows(ValidateException.class,
                () -> dataSourceAcl.requireOwned("missing", "user-a", "alice"));
    }

    @Test
    void dataSourceAcl_blankId_forbiddenWithoutLookup() {
        assertThrows(ValidateException.class,
                () -> dataSourceAcl.requireOwned("  ", "user-a", "alice"));
        verifyNoInteractions(dataSourcesMapper);
    }
}
