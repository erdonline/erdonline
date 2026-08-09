package com.erdonline.erd.security.aspect;

import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.erd.entity.DbChange;
import com.erdonline.erd.security.VersionDbKeyGuard;
import com.erdonline.erd.security.annotation.DbKey;
import com.erdonline.erd.security.annotation.ProjectId;
import com.erdonline.erd.security.annotation.RequireProjectAccess;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link ProjectAccessAspect}：{@code @RequireProjectAccess} 声明式权限校验的执行者。
 * 直接调 {@link ProjectAccessAspect#enforce}（而非搭 Spring AOP 代理）验证参数提取 +
 * 分支逻辑——本仓库既有测试风格均为纯 Mockito 单测，无 MockMvc/SpringBootTest 基础设施。
 */
@ExtendWith(MockitoExtension.class)
class ProjectAccessAspectTest {

    @Mock
    private VersionDbKeyGuard dbKeyGuard;

    private ProjectAccessAspect aspectUnder() {
        return new ProjectAccessAspect(dbKeyGuard);
    }

    // ---- 反射取值用的标注方法（模拟真实 Controller 方法签名） ----

    @RequireProjectAccess
    private static void mapProjectIdOnly(@ProjectId Map<String, Object> map) {
    }

    @RequireProjectAccess
    private static void mapProjectIdAndDbKey(@ProjectId @DbKey Map<String, Object> map) {
    }

    @RequireProjectAccess
    private static void stringProjectId(@ProjectId String projectId) {
    }

    @RequireProjectAccess
    private static void pojoProjectIdAndDbKey(@ProjectId @DbKey DbChange dbChange) {
    }

    @RequireProjectAccess
    private static void noProjectIdAnnotation(String changeId) {
    }

    private static JoinPoint joinPointFor(String methodName, Class<?> paramType, Object arg) throws NoSuchMethodException {
        Method method = ProjectAccessAspectTest.class.getDeclaredMethod(methodName, paramType);
        JoinPoint joinPoint = mock(JoinPoint.class);
        MethodSignature signature = mock(MethodSignature.class);
        when(joinPoint.getSignature()).thenReturn(signature);
        when(signature.getMethod()).thenReturn(method);
        when(joinPoint.getArgs()).thenReturn(new Object[]{arg});
        return joinPoint;
    }

    private RequireProjectAccess annotationOn(String methodName, Class<?> paramType) throws NoSuchMethodException {
        return ProjectAccessAspectTest.class.getDeclaredMethod(methodName, paramType)
                .getAnnotation(RequireProjectAccess.class);
    }

    @Test
    void mapWithProjectIdOnly_assertsMemberOnly() throws Exception {
        Map<String, Object> map = new HashMap<>();
        map.put("projectId", "p1");
        JoinPoint jp = joinPointFor("mapProjectIdOnly", Map.class, map);

        aspectUnder().enforce(jp, annotationOn("mapProjectIdOnly", Map.class));

        verify(dbKeyGuard).assertMember("p1");
        verify(dbKeyGuard, never()).assertDbKeyBelongsToCaller(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void mapWithProjectIdAndDbKey_assertsDbKeyOwnership() throws Exception {
        Map<String, Object> map = new HashMap<>();
        map.put("projectId", "p1");
        map.put("dbKey", "ds-a");
        JoinPoint jp = joinPointFor("mapProjectIdAndDbKey", Map.class, map);

        aspectUnder().enforce(jp, annotationOn("mapProjectIdAndDbKey", Map.class));

        verify(dbKeyGuard).assertDbKeyBelongsToCaller("p1", "ds-a");
        verify(dbKeyGuard, never()).assertMember(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void stringParameter_usedDirectlyAsProjectId() throws Exception {
        JoinPoint jp = joinPointFor("stringProjectId", String.class, "p-direct");

        aspectUnder().enforce(jp, annotationOn("stringProjectId", String.class));

        verify(dbKeyGuard).assertMember("p-direct");
    }

    @Test
    void pojoParameter_extractsViaGetterReflection() throws Exception {
        DbChange dbChange = new DbChange();
        dbChange.setProjectId("p-pojo");
        dbChange.setDbKey("ds-pojo");
        JoinPoint jp = joinPointFor("pojoProjectIdAndDbKey", DbChange.class, dbChange);

        aspectUnder().enforce(jp, annotationOn("pojoProjectIdAndDbKey", DbChange.class));

        verify(dbKeyGuard).assertDbKeyBelongsToCaller("p-pojo", "ds-pojo");
    }

    @Test
    void missingProjectIdAnnotation_failsClosed() throws Exception {
        JoinPoint jp = joinPointFor("noProjectIdAnnotation", String.class, "change-123");

        assertThrows(ValidateException.class, () ->
                aspectUnder().enforce(jp, annotationOn("noProjectIdAnnotation", String.class)));
    }

    @Test
    void blankProjectIdValue_failsClosed() throws Exception {
        Map<String, Object> map = new HashMap<>();
        map.put("projectId", "");
        JoinPoint jp = joinPointFor("mapProjectIdOnly", Map.class, map);

        assertThrows(ValidateException.class, () ->
                aspectUnder().enforce(jp, annotationOn("mapProjectIdOnly", Map.class)));
    }

    @Test
    void guardRejection_propagatesAsForbidden() throws Exception {
        Map<String, Object> map = new HashMap<>();
        map.put("projectId", "p-foreign");
        JoinPoint jp = joinPointFor("mapProjectIdOnly", Map.class, map);
        org.mockito.Mockito.doThrow(new ValidateException(com.erdonline.common.core.api.ApiErrorCode.FORBIDDEN))
                .when(dbKeyGuard).assertMember("p-foreign");

        assertThrows(ValidateException.class, () ->
                aspectUnder().enforce(jp, annotationOn("mapProjectIdOnly", Map.class)));
    }
}
