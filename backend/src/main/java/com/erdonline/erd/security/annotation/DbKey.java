package com.erdonline.erd.security.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 标注在 {@link RequireProjectAccess} 方法的某个参数上，告诉切面从这个参数取 db_key 并额外
 * 做归属校验（存在 + 快照哨兵或调用者名下的 data_sources.id）。取值规则同 {@link ProjectId}。
 * 可以和 {@link ProjectId} 标在同一个参数上（如同一个 {@code Map} body 里既有 projectId 又有 dbKey）。
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface DbKey {
    String field() default "dbKey";
}
