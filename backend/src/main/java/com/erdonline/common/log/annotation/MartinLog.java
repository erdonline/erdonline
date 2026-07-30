package com.erdonline.common.log.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/8/22
 * @describtion MartinLog 日志注解
 * @since 1.0
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface MartinLog {

    /**
     * 日志名称
     *
     * @return {String}
     */
    String value();
}
