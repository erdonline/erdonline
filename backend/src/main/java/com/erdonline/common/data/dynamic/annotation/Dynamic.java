package com.erdonline.common.data.dynamic.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * @author: liangcan
 * @version: 1.0
 * @date: 2022/12/3 13:57
 * @describtion: 动态数据源
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Dynamic {
    /**
     * 数据源名称名称
     *
     * @return {String}
     */
    String value() default "default";
}
