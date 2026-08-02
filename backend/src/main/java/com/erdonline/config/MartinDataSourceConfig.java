package com.erdonline.config;

import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionTemplate;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;

import javax.sql.DataSource;

/**
 * 系统库表数据源配置 —— 主数据源（SqlSessionFactory 名 martin* 为历史命名）。
 *
 * <p>ADR-0020：物理上与建模表同属单一业务库 {@code erd}；本配置仍负责
 * {@code com.erdonline.system.mapper}。两套 DS 指向同一 {@code DB_NAME}，
 * 按 mapper 包路由避免历史包结构大爆炸。</p>
 *
 * @see ErdDataSourceConfig
 * @see docs/adr/0020-single-database.md
 */
@Configuration
@MapperScan(
        basePackages = "com.erdonline.system.mapper",
        sqlSessionFactoryRef = "martinSqlSessionFactory",
        nameGenerator = FullyQualifiedMapperNameGenerator.class
)
public class MartinDataSourceConfig {

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource.martin")
    public DataSource martinDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    @Primary
    public SqlSessionFactory martinSqlSessionFactory(@org.springframework.beans.factory.annotation.Qualifier("martinDataSource") DataSource martinDataSource,
                                                     MybatisPlusInterceptor mybatisPlusInterceptor,
                                                     com.baomidou.mybatisplus.core.handlers.MetaObjectHandler metaObjectHandler) throws Exception {
        com.baomidou.mybatisplus.extension.spring.MybatisSqlSessionFactoryBean factory =
                new com.baomidou.mybatisplus.extension.spring.MybatisSqlSessionFactoryBean();
        factory.setDataSource(martinDataSource);
        factory.setMapperLocations(new PathMatchingResourcePatternResolver()
                .getResources("classpath*:mapper/system/*.xml"));
        factory.setPlugins(mybatisPlusInterceptor);
        factory.setConfiguration(MyBatisConfigSupport.mybatisConfiguration());
        factory.setGlobalConfig(MyBatisConfigSupport.globalConfig(metaObjectHandler));
        return factory.getObject();
    }

    @Bean
    @Primary
    public SqlSessionTemplate martinSqlSessionTemplate(SqlSessionFactory martinSqlSessionFactory) {
        return new SqlSessionTemplate(martinSqlSessionFactory);
    }

    @Bean
    @Primary
    public DataSourceTransactionManager transactionManager(DataSource martinDataSource) {
        return new DataSourceTransactionManager(martinDataSource);
    }
}
