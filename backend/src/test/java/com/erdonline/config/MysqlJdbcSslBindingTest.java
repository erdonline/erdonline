package com.erdonline.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * R-CFG-03：本地/dev JDBC TLS 默认关；prod 默认开 SSL + requireSSL，并关掉 allowPublicKeyRetrieval。
 */
class MysqlJdbcSslBindingTest {

    /** 与 application.yml 双 DS jdbc-url 占位符对齐（无 requireSSL）。 */
    private static final String LOCAL_JDBC =
            "jdbc:mysql://${MYSQLHOST:localhost}:${MYSQLPORT:3306}/${MYSQLDATABASE:erd}"
                    + "?useUnicode=true&useSSL=${MYSQL_USE_SSL:false}"
                    + "&characterEncoding=utf8&serverTimezone=GMT%2B8"
                    + "&allowPublicKeyRetrieval=${MYSQL_ALLOW_PUBLIC_KEY_RETRIEVAL:true}";

    /** 与 application-prod.yml 双 DS jdbc-url 占位符对齐。 */
    private static final String PROD_JDBC =
            "jdbc:mysql://${MYSQLHOST:localhost}:${MYSQLPORT:3306}/${MYSQLDATABASE:erd}"
                    + "?useUnicode=true&useSSL=${MYSQL_USE_SSL:true}"
                    + "&requireSSL=${MYSQL_REQUIRE_SSL:true}"
                    + "&characterEncoding=utf8&serverTimezone=GMT%2B8"
                    + "&allowPublicKeyRetrieval=${MYSQL_ALLOW_PUBLIC_KEY_RETRIEVAL:false}";

    @Test
    void localDefaultsDisableSslAndAllowPublicKeyRetrieval() {
        MockEnvironment env = new MockEnvironment();
        String url = env.resolveRequiredPlaceholders(LOCAL_JDBC);
        assertTrue(url.contains("useSSL=false"));
        assertTrue(url.contains("allowPublicKeyRetrieval=true"));
        assertFalse(url.contains("requireSSL="));
    }

    @Test
    void prodDefaultsRequireSslAndDisallowPublicKeyRetrieval() {
        MockEnvironment env = new MockEnvironment();
        String url = env.resolveRequiredPlaceholders(PROD_JDBC);
        assertTrue(url.contains("useSSL=true"));
        assertTrue(url.contains("requireSSL=true"));
        assertTrue(url.contains("allowPublicKeyRetrieval=false"));
    }

    @Test
    void prodComposeEscapeHatchDisablesSsl() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("MYSQL_USE_SSL", "false");
        env.setProperty("MYSQL_REQUIRE_SSL", "false");
        env.setProperty("MYSQL_ALLOW_PUBLIC_KEY_RETRIEVAL", "true");
        String url = env.resolveRequiredPlaceholders(PROD_JDBC);
        assertTrue(url.contains("useSSL=false"));
        assertTrue(url.contains("requireSSL=false"));
        assertTrue(url.contains("allowPublicKeyRetrieval=true"));
    }
}
