package com.erdonline.erd.security;

import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.erd.entity.DataDict;
import com.erdonline.erd.mapper.ProjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataDictAclTest {

    @Mock
    private ProjectMapper projectMapper;

    private ProjectAcl projectAcl;
    private DataDictAcl dataDictAcl;

    @BeforeEach
    void setUp() {
        projectAcl = new ProjectAcl(projectMapper);
        dataDictAcl = new DataDictAcl(projectAcl);
    }

    @Test
    void platform_readOnly_forAll() {
        DataDict platform = platformEntry();
        assertTrue(dataDictAcl.canRead(platform, "u1", "alice"));
        assertFalse(dataDictAcl.canWrite(platform, "u1", "alice"));
    }

    @Test
    void userScope_ownerCanWrite() {
        DataDict user = userEntry("u1", "alice");
        assertTrue(dataDictAcl.canRead(user, "u1", "alice"));
        assertTrue(dataDictAcl.canWrite(user, "u1", "alice"));
        assertFalse(dataDictAcl.canWrite(user, "u2", "bob"));
    }

    @Test
    void groupScope_memberCanWrite() {
        DataDict group = groupEntry("gp-1");
        when(projectMapper.countProjectMember("gp-1", "u1")).thenReturn(1);
        when(projectMapper.countProjectMember("gp-1", "u2")).thenReturn(0);

        assertTrue(dataDictAcl.canRead(group, "u1", "alice"));
        assertTrue(dataDictAcl.canWrite(group, "u1", "alice"));
        assertFalse(dataDictAcl.canRead(group, "u2", "bob"));
        assertFalse(dataDictAcl.canWrite(group, "u2", "bob"));
    }

    @Test
    void assertCreatable_rejectsPlatform() {
        DataDict platform = platformEntry();
        ValidateException ex = assertThrows(ValidateException.class,
                () -> dataDictAcl.assertCreatable(platform, "u1", "alice"));
        assertEquals("平台字段库只读", ex.getMessage());
    }

    @Test
    void assertCreatable_groupRequiresMember() {
        DataDict group = groupEntry("gp-1");
        when(projectMapper.countProjectMember("gp-1", "u1")).thenReturn(0);
        ValidateException ex = assertThrows(ValidateException.class,
                () -> dataDictAcl.assertCreatable(group, "u1", "alice"));
        assertEquals(ApiErrorCode.FORBIDDEN.getCode(), ex.getStatus());
        verify(projectMapper).countProjectMember("gp-1", "u1");
    }

    private static DataDict platformEntry() {
        DataDict d = new DataDict();
        d.setScopeType(DataDictScope.PLATFORM);
        d.setCreator("system");
        return d;
    }

    private static DataDict userEntry(String userId, String username) {
        DataDict d = new DataDict();
        d.setScopeType(DataDictScope.USER);
        d.setScopeId(userId);
        d.setCreator(username);
        return d;
    }

    private static DataDict groupEntry(String projectId) {
        DataDict d = new DataDict();
        d.setScopeType(DataDictScope.GROUP);
        d.setScopeId(projectId);
        d.setCreator("alice");
        return d;
    }
}
