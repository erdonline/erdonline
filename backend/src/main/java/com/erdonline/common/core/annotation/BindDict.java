package com.erdonline.common.core.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * @author 狮少
 * @version 1.0
 * @date 2020/9/16
 * @describtion 绑定数据库中字典表中的值
 * @since 1.0
 */
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
public @interface BindDict {
    /***
     * 绑定数据字典类型
     * @return
     */
    String type();

    /***
     * 数据字典项取值字段
     * @return
     */
    String field() default "";
}
