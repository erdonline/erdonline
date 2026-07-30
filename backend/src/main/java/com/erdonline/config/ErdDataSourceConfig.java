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
 * 建模库（erd）数据源配置。
 *
 * <p>负责 {@code com.erdonline.erd.mapper} 与 {@code com.erdonline.erd.plaza.mapper}，
 * 对应 MySQL 的 {@code erd} 库（项目/表模型/版本等建模元数据）。</p>
 *
 * @see MartinDataSourceConfig
 */
@Configuration
@MapperScan(
        basePackages = {"com.erdonline.erd.mapper", "com.erdonline.erd.plaza.mapper"},
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
                                                  MybatisPlusInterceptor mybatisPlusInterceptor) throws Exception {
        MybatisSqlSessionFactoryBean factory = new MybatisSqlSessionFactoryBean();
        factory.setDataSource(erdDataSource);
        factory.setMapperLocations(new PathMatchingResourcePatternResolver()
                .getResources("classpath*:mapper/*.xml"));
        factory.setPlugins(mybatisPlusInterceptor);
        factory.setConfiguration(MyBatisConfigSupport.mybatisConfiguration());
        factory.setGlobalConfig(MyBatisConfigSupport.globalConfig());
        return factory.getObject();
    }

    @Bean
    public SqlSessionTemplate erdSqlSessionTemplate(@org.springframework.beans.factory.annotation.Qualifier("erdSqlSessionFactory") SqlSessionFactory erdSqlSessionFactory) {
        return new SqlSessionTemplate(erdSqlSessionFactory);
    }
}
