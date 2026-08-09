package com.erdonline.erd.service.impl;

import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.erd.entity.DbChange;
import com.erdonline.erd.mapper.DbChangeMapper;
import com.erdonline.erd.security.VersionDbKeyGuard;
import com.erdonline.erd.service.DbVersionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class DbChangeServiceImplDuplicateTest {

    @Mock
    private DbChangeMapper dbChangeMapper;

    @Mock
    private DbVersionService dbVersionService;

    @Mock
    private VersionDbKeyGuard dbKeyGuard;

    @InjectMocks
    private DbChangeServiceImpl dbChangeService;

    @BeforeEach
    void wireMapper() {
        ReflectionTestUtils.setField(dbChangeService, "baseMapper", dbChangeMapper);
        lenient().when(dbKeyGuard.resolveDbKey(anyString(), anyString()))
                .thenAnswer(inv -> inv.getArgument(1));
    }

    @Test
    void saveVersion_duplicateVersion_returns409001() {
        doThrow(new DuplicateKeyException(
                "Duplicate entry 'p1-SNAPSHOT-1.0.0' for key 'db_change.uk_db_change_project_dbkey_version'"))
                .when(dbChangeMapper).insert(any(DbChange.class));

        DbChange incoming = new DbChange();
        incoming.setProjectId("p1");
        incoming.setDbKey("SNAPSHOT");
        incoming.setVersion("1.0.0");
        incoming.setVersionDesc("desc");

        R<?> result = dbChangeService.saveVersion(incoming);

        assertEquals(ApiErrorCode.VERSION_SAVE_DUPLICATE.getCode(), result.getCode());
        assertEquals(ApiErrorCode.VERSION_SAVE_DUPLICATE.getMsg(), result.getMsg());
        verify(dbChangeMapper).insert(any(DbChange.class));
    }

    @Test
    void saveVersion_otherDuplicateKey_rethrows() {
        doThrow(new DuplicateKeyException("Duplicate entry 'x' for key 'other_idx'"))
                .when(dbChangeMapper).insert(any(DbChange.class));

        DbChange incoming = new DbChange();
        incoming.setProjectId("p1");
        incoming.setDbKey("SNAPSHOT");
        incoming.setVersion("1.0.0");
        incoming.setVersionDesc("desc");

        try {
            dbChangeService.saveVersion(incoming);
            assertTrue(false, "expected DuplicateKeyException");
        } catch (DuplicateKeyException e) {
            assertTrue(e.getMessage().contains("other_idx"));
        }
    }

    @Test
    void isVersionDuplicateKey_recognizesLegacyAndNewIndexNames() {
        assertTrue(DbChangeServiceImpl.isVersionDuplicateKey(
                new DuplicateKeyException("... uk_db_change_project_dbkey_version ...")));
        assertTrue(DbChangeServiceImpl.isVersionDuplicateKey(
                new DuplicateKeyException("... uni_versin_projectid_dbkey ...")));
        assertFalse(DbChangeServiceImpl.isVersionDuplicateKey(
                new DuplicateKeyException("... other ...")));
    }
}
