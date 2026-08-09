package com.erdonline.erd.catalog;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(CatalogProperties.class)
public class CatalogConfiguration {
}
