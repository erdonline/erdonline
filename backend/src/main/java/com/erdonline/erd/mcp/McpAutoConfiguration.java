package com.erdonline.erd.mcp;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(McpProperties.class)
@ConditionalOnProperty(prefix = "erd.mcp", name = "enabled", havingValue = "true", matchIfMissing = true)
public class McpAutoConfiguration {
}
