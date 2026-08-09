package com.erdonline.erd.security.aspect;

import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.erd.security.VersionDbKeyGuard;
import com.erdonline.erd.security.annotation.DbKey;
import com.erdonline.erd.security.annotation.ProjectId;
import com.erdonline.erd.security.annotation.RequireProjectAccess;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.util.Map;

/**
 * {@link RequireProjectAccess} 的统一执行者：项目成员 + db_key 归属校验的唯一入口。
 *
 * <p>Controller 方法只需声明 {@code @RequireProjectAccess} + 参数级 {@link ProjectId} /
 * {@link DbKey}，具体校验逻辑（成员判定、别名归一化、data_sources 归属）全部委托
 * {@link VersionDbKeyGuard}，不在业务代码里重复散落 assertMember/dbKey 判断。
 * {@code @Order(HIGHEST_PRECEDENCE)} 确保先于 {@code @Dynamic} 等切换数据源/执行业务的
 * 环绕通知触发，避免"先执行后拒绝"的时序问题。</p>
 */
@Aspect
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
@Slf4j
public class ProjectAccessAspect {

    private final VersionDbKeyGuard dbKeyGuard;

    @Before("@annotation(requireProjectAccess)")
    public void enforce(JoinPoint joinPoint, RequireProjectAccess requireProjectAccess) {
        Method method = ((MethodSignature) joinPoint.getSignature()).getMethod();
        Annotation[][] paramAnnotations = method.getParameterAnnotations();
        Object[] args = joinPoint.getArgs();

        String projectId = null;
        String dbKey = null;
        boolean dbKeyRequested = false;

        for (int i = 0; i < paramAnnotations.length; i++) {
            for (Annotation annotation : paramAnnotations[i]) {
                if (annotation instanceof ProjectId projectIdAnn) {
                    projectId = extractField(args[i], projectIdAnn.field());
                } else if (annotation instanceof DbKey dbKeyAnn) {
                    dbKeyRequested = true;
                    dbKey = extractField(args[i], dbKeyAnn.field());
                }
            }
        }

        if (!StringUtils.hasText(projectId)) {
            throw new ValidateException("projectId 为空");
        }
        if (dbKeyRequested) {
            dbKeyGuard.assertDbKeyBelongsToCaller(projectId, dbKey);
        } else {
            dbKeyGuard.assertMember(projectId);
        }
    }

    /**
     * 从方法参数里按 {@code field} 取值：String 参数直接返回；Map 取键；POJO 反射调用 getter。
     * 取不到（参数为 null / 无该 getter）一律返回 null，交给上层 fail-closed。
     */
    private static String extractField(Object arg, String field) {
        if (arg == null) {
            return null;
        }
        if (arg instanceof String s) {
            return s;
        }
        if (arg instanceof Map<?, ?> map) {
            Object v = map.get(field);
            return v == null ? null : String.valueOf(v);
        }
        String getter = "get" + Character.toUpperCase(field.charAt(0)) + field.substring(1);
        try {
            Method m = arg.getClass().getMethod(getter);
            Object v = m.invoke(arg);
            return v == null ? null : String.valueOf(v);
        } catch (ReflectiveOperationException e) {
            log.warn("RequireProjectAccess: 无法从 {} 提取字段 {}：{}",
                    arg.getClass().getSimpleName(), field, e.toString());
            return null;
        }
    }
}
