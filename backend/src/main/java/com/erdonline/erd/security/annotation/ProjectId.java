package com.erdonline.erd.security.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 标注在 {@link RequireProjectAccess} 方法的某个参数上，告诉切面从这个参数取 projectId。
 * String 类型参数忽略 {@link #field()}，参数本身即 projectId；Map/POJO 参数按
 * {@link #field()}（Map 键名 / getter 字段名）反射取值。
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface ProjectId {
    String field() default "projectId";
}
