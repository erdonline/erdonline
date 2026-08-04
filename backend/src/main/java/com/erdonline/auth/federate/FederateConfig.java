package com.erdonline.auth.federate;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(FederateProperties.class)
public class FederateConfig {
}
