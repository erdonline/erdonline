package com.erdonline.erd.controller;

import com.erdonline.common.core.api.R;
import com.erdonline.erd.service.DbChangeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.same;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectDdlControllerTest {

    @Mock
    private DbChangeService dbChangeService;

    private ProjectDdlController controller;

    @BeforeEach
    void setUp() {
        controller = new ProjectDdlController();
        ReflectionTestUtils.setField(controller, "dbChangeService", dbChangeService);
    }

    @Test
    void previewTemplate_delegatesToService() {
        Map<String, Object> body = Map.of("projectId", "p1", "dbKey", "default");
        R expected = R.ok(Map.of("sql", "CREATE TABLE T_SAMPLE"));
        when(dbChangeService.previewDdlTemplate(same(body))).thenReturn(expected);

        R result = controller.previewTemplate(body);

        assertSame(expected, result);
        verify(dbChangeService).previewDdlTemplate(body);
    }

    @Test
    void export_delegatesToService() {
        Map<String, Object> body = Map.of("projectId", "p1", "dbKey", "default");
        R expected = R.ok(Map.of("sql", "CREATE TABLE foo"));
        when(dbChangeService.generateExportDdl(same(body))).thenReturn(expected);

        R result = controller.export(body);

        assertSame(expected, result);
        verify(dbChangeService).generateExportDdl(body);
    }

    @Test
    void table_delegatesToService() {
        Map<String, Object> body = Map.of("projectId", "p1", "dbKey", "default");
        R expected = R.ok(Map.of("sql", "CREATE TABLE bar"));
        when(dbChangeService.generateTableDdl(same(body))).thenReturn(expected);

        R result = controller.table(body);

        assertSame(expected, result);
        verify(dbChangeService).generateTableDdl(body);
    }
}
