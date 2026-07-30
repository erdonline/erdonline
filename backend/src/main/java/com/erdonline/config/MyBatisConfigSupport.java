package com.erdonline.config;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.config.GlobalConfig;
import com.baomidou.mybatisplus.core.config.GlobalConfig.DbConfig;

/**
 * 双数据源下共享的 MyBatis-Plus 配置工厂。
 *
 * <p>为每个 SqlSessionFactory 提供独立的 {@link MybatisConfiguration} 与 {@link GlobalConfig} 实例
 * （不可共享同一实例，否则 mapper 会重复注册），统一开启驼峰映射与逻辑删除，
 * 等价于原 application.yml 里的 mybatis-plus 全局配置。</p>
 */
final class MyBatisConfigSupport {

    private MyBatisConfigSupport() {
    }

    static MybatisConfiguration mybatisConfiguration() {
        MybatisConfiguration configuration = new MybatisConfiguration();
        configuration.setMapUnderscoreToCamelCase(true);
        return configuration;
    }

    static GlobalConfig globalConfig() {
        GlobalConfig globalConfig = new GlobalConfig();
        globalConfig.setBanner(false);
        DbConfig dbConfig = new DbConfig();
        dbConfig.setLogicDeleteField("delFlag");
        dbConfig.setLogicDeleteValue("1");
        dbConfig.setLogicNotDeleteValue("0");
        globalConfig.setDbConfig(dbConfig);
        return globalConfig;
    }
}
