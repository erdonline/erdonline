package com.erdonline.common.security;

import com.erdonline.common.security.properties.PermitAllUrlProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

/**
 * 安全相关组件扫描与配置属性绑定。
 *
 * @author ERD Online
 */
@Configuration
@EnableCaching
@EnableConfigurationProperties(PermitAllUrlProperties.class)
@ComponentScan(basePackages = {"com.erdonline.common.security", "com.erdonline.common.core"})
public class MartinSecurityAutoConfiguration {
}
