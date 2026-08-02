package com.erdonline.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;

import javax.sql.DataSource;

/**
 * 业务库 Schema / 种子迁移（单一数据库 {@code erd}，见 ADR-0020）。
 *
 * <p>禁用 Boot 默认 Flyway（{@code spring.flyway.enabled=false}），仅对本
 * {@code erdDataSource} 执行 {@code classpath:db/migration/erd}。</p>
 */
@Configuration
public class ErdFlywayConfig {

    @Bean(initMethod = "migrate")
    @DependsOn("erdDataSource")
    public Flyway erdFlyway(@Qualifier("erdDataSource") DataSource erdDataSource) {
        return Flyway.configure()
                .dataSource(erdDataSource)
                .locations("classpath:db/migration/erd")
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .table("flyway_schema_history")
                .load();
    }
}
