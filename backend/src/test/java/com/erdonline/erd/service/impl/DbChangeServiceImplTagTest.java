package com.erdonline.erd.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.erdonline.common.core.api.R;
import com.erdonline.erd.entity.DbChange;
import com.erdonline.erd.mapper.DbChangeMapper;
import com.erdonline.erd.service.DbVersionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DbChangeServiceImplTagTest {

    @Mock
    private DbChangeMapper dbChangeMapper;

    @Mock
    private DbVersionService dbVersionService;

    @InjectMocks
    private DbChangeServiceImpl dbChangeService;

    @BeforeEach
    void wireMapper() {
        ReflectionTestUtils.setField(dbChangeService, "baseMapper", dbChangeMapper);
    }

    @Test
    void saveVersion_rejectsDuplicateTagInSameProject() {
        when(dbChangeMapper.selectCount(any())).thenReturn(1L);

        DbChange incoming = new DbChange();
        incoming.setProjectId("p1");
        incoming.setDbKey("SNAPSHOT");
        incoming.setVersion("1.0.1");
        incoming.setVersionDesc("desc");
        incoming.setTag("里程碑");

        R<?> result = dbChangeService.saveVersion(incoming);

        assertTrue(result.getCode() != 200);
        assertTrue(result.getMsg().contains("标签"));
        verify(dbChangeMapper, never()).insert(any(DbChange.class));
        verify(dbChangeMapper, never()).updateById(any(DbChange.class));
    }

    @Test
    void saveVersion_normalizesBlankTagAndInserts() {
        when(dbChangeMapper.insert(any(DbChange.class))).thenReturn(1);

        DbChange incoming = new DbChange();
        incoming.setProjectId("p1");
        incoming.setDbKey("SNAPSHOT");
        incoming.setVersion("1.0.0");
        incoming.setVersionDesc("desc");
        incoming.setTag("   ");

        R<?> result = dbChangeService.saveVersion(incoming);

        assertEquals(200, result.getCode());
        ArgumentCaptor<DbChange> captor = ArgumentCaptor.forClass(DbChange.class);
        verify(dbChangeMapper).insert(captor.capture());
        assertNull(captor.getValue().getTag());
    }

    @Test
    void isTagTaken_falseWhenBlank() {
        assertFalse(dbChangeService.isTagTaken("p1", "  ", null));
        assertFalse(dbChangeService.isTagTaken(null, "t", null));
    }

    @Test
    @SuppressWarnings("unchecked")
    void isTagTaken_trueWhenCountPositive() {
        when(dbChangeMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);
        assertTrue(dbChangeService.isTagTaken("p1", "v1.0", "other-id"));
    }
}
