package com.erdonline.erd.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.erdonline.erd.entity.DbChange;
import com.erdonline.erd.entity.DbVersion;
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

import java.util.Collection;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 回归：重建版本（RebuildVersion → deleteAllHistory）必须与单删 deleteHistory
 * 一样清掉 db_version 推送书签，否则重建基线后旧书签残留，
 * 「已推送/未推送」标签会用旧版本号误判新基线状态。
 */
@ExtendWith(MockitoExtension.class)
class DbChangeServiceImplDeleteAllTest {

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
    void deleteAllHistory_alsoClearsDbVersionBookmarks() {
        when(dbChangeMapper.delete(any())).thenReturn(3);

        DbChange criteria = new DbChange();
        criteria.setProjectId("p1");
        criteria.setDbKey("dbkey1");

        dbChangeService.deleteAllHistory(criteria);

        ArgumentCaptor<QueryWrapper<DbVersion>> captor = ArgumentCaptor.forClass(QueryWrapper.class);
        verify(dbVersionService).remove(captor.capture());

        String sql = captor.getValue().getCustomSqlSegment();
        assertTrue(sql.contains("project_id"), "应按 project_id 过滤书签，实际 SQL：" + sql);
        assertTrue(sql.contains("db_key"), "应按 db_key 过滤书签，实际 SQL：" + sql);
        Collection<Object> values = captor.getValue().getParamNameValuePairs().values();
        assertTrue(values.contains("p1"), "过滤值应含 project_id=p1，实际：" + values);
        assertTrue(values.contains("dbkey1"), "过滤值应含 db_key=dbkey1，实际：" + values);
    }
}
