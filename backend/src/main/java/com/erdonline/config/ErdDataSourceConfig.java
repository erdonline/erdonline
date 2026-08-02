package com.erdonline.config;

import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.spring.MybatisSqlSessionFactoryBean;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionTemplate;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import javax.sql.DataSource;

/**
 * 建模表数据源配置（SqlSessionFactory 名 erd*）。
 *
 * <p>ADR-0020：与系统表同属单一业务库 {@code erd}；本配置负责 {@code com.erdonline.erd.mapper}。
 * Flyway（{@link ErdFlywayConfig}）绑本 DS，迁移含基线种子与增量 schema。</p>
 *
 * @see MartinDataSourceConfig
 * @see docs/adr/0020-single-database.md
 */
@Configuration
@MapperScan(
        basePackages = "com.erdonline.erd.mapper",
        sqlSessionFactoryRef = "erdSqlSessionFactory",
        nameGenerator = FullyQualifiedMapperNameGenerator.class
)
public class ErdDataSourceConfig {

    @Bean
    @ConfigurationProperties("spring.datasource.erd")
    public DataSource erdDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    public SqlSessionFactory erdSqlSessionFactory(@org.springframework.beans.factory.annotation.Qualifier("erdDataSource") DataSource erdDataSource,
                                                  MybatisPlusInterceptor mybatisPlusInterceptor,
                                                  com.baomidou.mybatisplus.core.handlers.MetaObjectHandler metaObjectHandler) throws Exception {
        MybatisSqlSessionFactoryBean factory = new MybatisSqlSessionFactoryBean();
        factory.setDataSource(erdDataSource);
        factory.setMapperLocations(new PathMatchingResourcePatternResolver()
                .getResources("classpath*:mapper/*.xml"));
        factory.setPlugins(mybatisPlusInterceptor);
        factory.setConfiguration(MyBatisConfigSupport.mybatisConfiguration());
        factory.setGlobalConfig(MyBatisConfigSupport.globalConfig(metaObjectHandler));
        return factory.getObject();
    }

    @Bean
    public SqlSessionTemplate erdSqlSessionTemplate(@org.springframework.beans.factory.annotation.Qualifier("erdSqlSessionFactory") SqlSessionFactory erdSqlSessionFactory) {
        return new SqlSessionTemplate(erdSqlSessionFactory);
    }
}
