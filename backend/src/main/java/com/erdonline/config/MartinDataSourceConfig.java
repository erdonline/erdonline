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
 * 系统库（martin）数据源配置 —— 主数据源。
 *
 * <p>单体化后 system 与 erd 两个业务库表名冲突（sys_user/sys_role 等 schema 不同），
 * 因此保留双数据源：本配置负责 {@code com.erdonline.system.mapper} 及公共库表，
 * 对应 MySQL 的 {@code martin} 库。</p>
 *
 * @see ErdDataSourceConfig
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
