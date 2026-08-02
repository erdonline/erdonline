package com.erdonline.erd.controller;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.erdonline.common.core.api.R;
import com.erdonline.erd.entity.Approval;
import com.erdonline.erd.service.ApprovalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApprovalControllerTest {

    @Mock
    private ApprovalService approvalService;

    private ApprovalController controller;

    @BeforeEach
    void setUp() {
        controller = spy(new ApprovalController());
        ReflectionTestUtils.setField(controller, "approvalService", approvalService);
    }

    @Test
    void update_pass_whenSqlFails_doesNotUpdateOrSync() {
        Approval approval = pendingApproval("v1");
        when(approvalService.getById("a1")).thenReturn(approval);
        doReturn(R.failed("连接失败!出错消息：refused")).when(controller).execApproveSql(any());

        R result = controller.update("a1", passParam());

        assertTrue(result.invalid());
        assertEquals("连接失败!出错消息：refused", result.getMsg());
        verify(approvalService, never()).syncBdVersion(any());
        verify(approvalService, never()).update(any(Approval.class), any(Wrapper.class));
    }

    @Test
    void update_pass_whenSqlThrows_doesNotUpdateOrSync() {
        Approval approval = pendingApproval("v1");
        when(approvalService.getById("a1")).thenReturn(approval);
        doThrow(new RuntimeException("驱动加载失败")).when(controller).execApproveSql(any());

        R result = controller.update("a1", passParam());

        assertTrue(result.invalid());
        assertEquals("驱动加载失败", result.getMsg());
        verify(approvalService, never()).syncBdVersion(any());
        verify(approvalService, never()).update(any(Approval.class), any(Wrapper.class));
    }

    @Test
    void update_pass_whenSqlOk_syncsThenUpdates() {
        Approval approval = pendingApproval("v1");
        when(approvalService.getById("a1")).thenReturn(approval);
        doReturn(R.ok("ok")).when(controller).execApproveSql(any());
        when(approvalService.syncBdVersion("v1")).thenReturn(R.ok(1));
        when(approvalService.update(any(Approval.class), any(Wrapper.class))).thenReturn(true);

        R result = controller.update("a1", passParam());

        assertTrue(result.valid());
        verify(approvalService).syncBdVersion(eq("v1"));
        verify(approvalService).update(any(Approval.class), any(Wrapper.class));
    }

    @Test
    void update_pass_blankDbInfo_failsWithoutSideEffects() {
        Approval approval = pendingApproval(null);
        approval.setDbInfo("  ");
        when(approvalService.getById("a1")).thenReturn(approval);

        R result = controller.update("a1", passParam());

        assertTrue(result.invalid());
        assertEquals("未配置目标数据源信息", result.getMsg());
        verify(approvalService, never()).syncBdVersion(any());
        verify(approvalService, never()).update(any(Approval.class), any(Wrapper.class));
        verify(controller, never()).execApproveSql(any());
    }

    private static Approval pendingApproval(String versionId) {
        Approval approval = new Approval();
        approval.setId("a1");
        approval.setApproveStatus("0");
        approval.setVersionId(versionId);
        approval.setApproveSql("SELECT 1");
        approval.setDbInfo(
                "{\"url\":\"jdbc:mysql://127.0.0.1:3306/erd\",\"driverClassName\":\"com.mysql.cj.jdbc.Driver\",\"username\":\"u\",\"password\":\"p\"}");
        return approval;
    }

    private static Map<String, Object> passParam() {
        Map<String, Object> param = new HashMap<>();
        param.put("approveStatus", "1");
        param.put("approveResult", "通过");
        param.put("separator", ";");
        return param;
    }
}
