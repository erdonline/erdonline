package com.erdonline.config;

import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;

import javax.sql.DataSource;

/**
 * 建模库（erd）Schema 迁移。双数据源下禁用 Boot 默认 Flyway（见 application.yml），
 * 仅对 {@code erdDataSource} 执行 {@code classpath:db/migration/erd}。
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
