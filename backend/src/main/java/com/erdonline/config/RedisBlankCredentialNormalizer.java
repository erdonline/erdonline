package com.erdonline.config;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.boot.autoconfigure.data.redis.RedisProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

/**
 * {@code password: ${REDISPASSWORD:}} / {@code username: ${REDISUSER:}} 在未设置时解析为空串，
 * 空串会使 Redisson 发 {@code AUTH ""} → WRONGPASS。在 RedisProperties 初始化后、连 Redis 前把空白凭证规范为 null。
 */
@Configuration(proxyBeanMethods = false)
public class RedisBlankCredentialNormalizer {

    @Bean
    static BeanPostProcessor redisBlankCredentialPostProcessor() {
        return new BeanPostProcessor() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
                if (bean instanceof RedisProperties props) {
                    sanitize(props);
                }
                return bean;
            }
        };
    }

    /** Visible for unit tests. */
    static void sanitize(RedisProperties properties) {
        if (!StringUtils.hasText(properties.getPassword())) {
            properties.setPassword(null);
        }
        if (!StringUtils.hasText(properties.getUsername())) {
            properties.setUsername(null);
        }
    }
}
