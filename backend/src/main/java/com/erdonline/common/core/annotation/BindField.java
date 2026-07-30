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
 * @describtion BindField
 * @since 1.0
 */
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Inherited
@Documented
public @interface BindField {
    /***
     * 绑定外键的Entity类，比如@BindField(entity= User.class,field="username")
     * @return
     */
    Class entity();

    /***
     * 绑定外键Entity要显示的数据库字段，，比如@BindField(entity=User.class,field="username")
     * @return
     */
    String field();

}
