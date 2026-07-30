package com.erdonline.common.swagger.annotation;

import com.erdonline.common.swagger.MartinSwaggerAutoConfiguration;
import org.springframework.context.annotation.Import;
import springfox.documentation.swagger2.annotations.EnableSwagger2;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/6/24
 * @describtion EnableMartinSwagger2
 * @since 1.0
 */
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@EnableSwagger2
@Import(MartinSwaggerAutoConfiguration.class)
public @interface EnableMartinSwagger2 {
}
