package com.erdonline.config;

import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.support.BeanNameGenerator;
import org.springframework.context.annotation.AnnotationBeanNameGenerator;
import org.springframework.core.type.ClassMetadata;

/**
 * 用全限定类名作为 mapper bean 名，避免跨模块同名 mapper 冲突。
 *
 * <p>系统库（martin）与建模库（erd）都存在 {@code CodeMapper}，
 * 默认按短类名生成 bean 名会冲突。此生成器改用全限定名区分。</p>
 */
public class FullyQualifiedMapperNameGenerator extends AnnotationBeanNameGenerator implements BeanNameGenerator {
    @Override
    public String generateBeanName(BeanDefinition definition, org.springframework.beans.factory.support.BeanDefinitionRegistry registry) {
        if (definition.getBeanClassName() != null) {
            return definition.getBeanClassName();
        }
        return super.generateBeanName(definition, registry);
    }
}
