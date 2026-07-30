package com.erdonline.common.data;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.StrUtil;
import org.yaml.snakeyaml.introspector.PropertyUtils;

import javax.validation.Constraint;
import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import javax.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;
import java.util.Map;

import static java.lang.annotation.RetentionPolicy.RUNTIME;
import static java.lang.annotation.ElementType.TYPE;

/**
 * @author: 零代科技
 * @version: 1.0
 * @date: 2023/3/4 16:53
 * @describtion: AtLeastOneNotNull
 */
@Target({TYPE})
@Retention(RUNTIME)
@Constraint(validatedBy = AtLeastOneNotNull.AtLeastOneNotNullValidator.class)
@Documented
public @interface AtLeastOneNotNull {
    String message() default "at least one not null";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    String[] fieldNames();

    class AtLeastOneNotNullValidator implements ConstraintValidator<AtLeastOneNotNull, Object> {

        private String[] fieldNames;

        @Override
        public void initialize(AtLeastOneNotNull constraintAnnotation) {
            this.fieldNames = constraintAnnotation.fieldNames();
        }

        @Override
        public boolean isValid(Object object, ConstraintValidatorContext constraintContext) {

            if (object == null) {
                return true;
            }
            try {
                for (String fieldName : fieldNames) {
                    Map entity = BeanUtil.beanToMap(object);
                    if (entity.get(fieldName) == null) {
                        continue;
                    }
                    String property = entity.get(fieldName).toString();
                    if (StrUtil.isNotBlank(property)) return true;
                }
                return false;
            } catch (Exception e) {
                return false;
            }
        }
    }
}
