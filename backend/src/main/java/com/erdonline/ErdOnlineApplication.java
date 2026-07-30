package com.erdonline;

import com.baomidou.mybatisplus.autoconfigure.MybatisPlusAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * ERD Online 单体应用统一启动类。
 *
 * <p>合并自原微服务的三个启动类：biz-auth、biz-system、extension-ncnb。
 * 去除了 Nacos 服务发现（@EnableDiscoveryClient）与 Feign，改为进程内本地调用。</p>
 *
 * <p>禁用 Spring Boot 单数据源自动配置与 MyBatis-Plus 自动配置：系统库（martin）与建模库（erd）
 * 表名冲突，由 {@link com.erdonline.config.MartinDataSourceConfig} 与
 * {@link com.erdonline.config.ErdDataSourceConfig} 显式配置双数据源与各自的 SqlSessionFactory，
 * 按 mapper 包路由，避免 MP 自动配置把全部 mapper 绑定到主数据源。</p>
 *
 * @author ERD Online
 * @since 1.0
 */
@EnableAsync
@EnableScheduling
@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class, MybatisPlusAutoConfiguration.class})
public class ErdOnlineApplication {
    public static void main(String[] args) {
        SpringApplication.run(ErdOnlineApplication.class, args);
    }
}
