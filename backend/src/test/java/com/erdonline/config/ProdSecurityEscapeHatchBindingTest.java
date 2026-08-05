package com.erdonline.config;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 回归 R-CFG-04：{@code application-prod.yml} 曾把 {@code allow-open-register} /
 * {@code allow-demo-admin} 写成字面量 {@code false}。Spring Boot 的 profile 专属文档
 * （{@code application-prod.yml}）在配置数据解析中优先级高于默认文档（{@code application.yml}），
 * 所以字面量 {@code false} 会无条件覆盖 {@code application.yml} 里
 * {@code ${ERD_ALLOW_OPEN_REGISTER:false}} 的求值结果——即使容器里
 * {@code ERD_ALLOW_OPEN_REGISTER=true}，prod 生效值仍恒为 {@code false}
 * （文档承诺的「逃生阀」实际不生效）。
 *
 * <p>本测试直接加载真实 classpath 下的 {@code application.yml} +
 * {@code application-prod.yml}（不建业务 Bean，只读 {@link ConfigurableEnvironment}），
 * 用 System property 模拟容器注入的同名环境变量（与 {@code SPRING_PROFILES_ACTIVE=prod}
 * 一样，走同一条 {@code ${VAR:default}} 占位符解析路径，真实还原容器场景）。</p>
 */
class ProdSecurityEscapeHatchBindingTest {

    private static final String[] MANAGED_KEYS = {
            "SPRING_PROFILES_ACTIVE",
            "ERD_ALLOW_OPEN_REGISTER",
            "ERD_ALLOW_DEMO_ADMIN",
            "ERD_E2E_ACCOUNTS_ENABLED",
    };

    private final Map<String, String> savedProps = new HashMap<>();

    @AfterEach
    void restoreSystemProperties() {
        for (String key : MANAGED_KEYS) {
            String saved = savedProps.get(key);
            if (saved == null) {
                System.clearProperty(key);
            } else {
                System.setProperty(key, saved);
            }
        }
        savedProps.clear();
    }

    /** 一个不触发组件扫描/自动配置的最小 source，只用来跑通 Spring Boot 的配置加载管线。 */
    static class EmptyProdConfigProbe {
    }

    @Test
    void prodDefaultsKeepAllThreeGatesClosed() {
        try (ConfigurableApplicationContext ctx = prodContext()) {
            ConfigurableEnvironment env = ctx.getEnvironment();
            assertFalse(env.getProperty("erd.security.allow-open-register", Boolean.class));
            assertFalse(env.getProperty("erd.security.allow-demo-admin", Boolean.class));
            assertFalse(env.getProperty("erd.security.e2e-accounts-enabled", Boolean.class));
        }
    }

    @Test
    void prodEscapeHatchEnvVarsEnableOpenRegisterAndDemoAdmin() {
        try (ConfigurableApplicationContext ctx = prodContext(
                "ERD_ALLOW_OPEN_REGISTER", "true", "ERD_ALLOW_DEMO_ADMIN", "true")) {
            ConfigurableEnvironment env = ctx.getEnvironment();
            assertTrue(env.getProperty("erd.security.allow-open-register", Boolean.class),
                    "ERD_ALLOW_OPEN_REGISTER=true 应能在 prod 生效（逃生阀）");
            assertTrue(env.getProperty("erd.security.allow-demo-admin", Boolean.class),
                    "ERD_ALLOW_DEMO_ADMIN=true 应能在 prod 生效（逃生阀）");
        }
    }

    @Test
    void prodE2eAccountsHasNoEscapeHatchByDesign() {
        try (ConfigurableApplicationContext ctx = prodContext("ERD_E2E_ACCOUNTS_ENABLED", "true")) {
            assertFalse(ctx.getEnvironment().getProperty("erd.security.e2e-accounts-enabled", Boolean.class),
                    "e2e 种子账号在 prod 无逃生阀，须恒为 false");
        }
    }

    /**
     * kvPairs 为 key1, value1, key2, value2, ... 形式，模拟容器里以同名 OS 环境变量注入。
     * 用 System property 而非真正的进程环境变量，是因为 JVM 内无法在测试期修改自身 os env，
     * 但两者在 Spring 的 {@code Environment} 占位符解析中优先级/语义一致，足以还原容器场景。
     */
    private ConfigurableApplicationContext prodContext(String... kvPairs) {
        setManagedProperty("SPRING_PROFILES_ACTIVE", "prod");
        for (int i = 0; i + 1 < kvPairs.length; i += 2) {
            setManagedProperty(kvPairs[i], kvPairs[i + 1]);
        }
        return new SpringApplicationBuilder(EmptyProdConfigProbe.class)
                .web(WebApplicationType.NONE)
                .run();
    }

    private void setManagedProperty(String key, String value) {
        savedProps.putIfAbsent(key, System.getProperty(key));
        System.setProperty(key, value);
    }
}
