package com.erdonline.erd.service.impl;

import com.erdonline.common.core.api.R;
import com.erdonline.erd.entity.DbChange;
import com.erdonline.erd.mapper.DbChangeMapper;
import com.erdonline.erd.service.DbVersionService;
import com.erdonline.erd.service.VersionAttributionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DbChangeServiceImplAttributionTest {

    @Mock
    private DbChangeMapper dbChangeMapper;

    @Mock
    private DbVersionService dbVersionService;

    @Mock
    private VersionAttributionService versionAttributionService;

    @InjectMocks
    private DbChangeServiceImpl dbChangeService;

    @BeforeEach
    void wireMapper() {
        ReflectionTestUtils.setField(dbChangeService, "baseMapper", dbChangeMapper);
    }

    @Test
    void saveVersion_recordsAttributionAfterSuccessfulInsert() {
        when(dbChangeMapper.insert(any(DbChange.class))).thenReturn(1);

        DbChange incoming = new DbChange();
        incoming.setProjectId("p1");
        incoming.setDbKey("SNAPSHOT");
        incoming.setVersion("1.0.0");
        incoming.setVersionDesc("desc");
        incoming.setAttribution(Map.of("utm_source", "hn", "utm_medium", "show", "ts", 1234567890L));

        R<?> result = dbChangeService.saveVersion(incoming);

        assertEquals(200, result.getCode());
        ArgumentCaptor<DbChange> captor = ArgumentCaptor.forClass(DbChange.class);
        verify(versionAttributionService).recordIfPresent(captor.capture(), eq(incoming.getAttribution()));
        assertEquals("p1", captor.getValue().getProjectId());
    }
}
