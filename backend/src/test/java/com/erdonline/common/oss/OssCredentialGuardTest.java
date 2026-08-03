package com.erdonline.common.oss;

import com.erdonline.common.oss.properties.OssProperties;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * R-CFG-05：prod 拒 MinIO 安装默认密钥对；未启用 endpoint 时放行。
 */
class OssCredentialGuardTest {

    @Test
    void skipsWhenEndpointBlank() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        OssProperties.MinioConfiguration minio = new OssProperties.MinioConfiguration();
        minio.setEndpoint("  ");
        minio.setAccessKey(OssCredentialGuard.INSECURE_DEV_ACCESS_KEY);
        minio.setSecretKey(OssCredentialGuard.INSECURE_DEV_SECRET_KEY);
        assertDoesNotThrow(() -> OssCredentialGuard.assertSafeForProfile(minio, env));
        assertDoesNotThrow(() -> OssCredentialGuard.assertSafeForProfile(null, env));
    }

    @Test
    void prodRejectsBlankCredentialsWhenEndpointSet() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        OssProperties.MinioConfiguration minio = new OssProperties.MinioConfiguration();
        minio.setEndpoint("http://minio:9000");
        minio.setAccessKey(" ");
        minio.setSecretKey("x");
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> OssCredentialGuard.assertSafeForProfile(minio, env));
        assertTrue(ex.getMessage().contains("blank"));
    }

    @Test
    void prodRejectsKnownMinioDefaults() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        OssProperties.MinioConfiguration minio = new OssProperties.MinioConfiguration();
        minio.setEndpoint("http://minio:9000");
        minio.setAccessKey(OssCredentialGuard.INSECURE_DEV_ACCESS_KEY);
        minio.setSecretKey(OssCredentialGuard.INSECURE_DEV_SECRET_KEY);
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> OssCredentialGuard.assertSafeForProfile(minio, env));
        assertTrue(ex.getMessage().contains("minio/minio123"));
    }

    @Test
    void nonProdAllowsKnownMinioDefaults() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        OssProperties.MinioConfiguration minio = new OssProperties.MinioConfiguration();
        minio.setEndpoint("http://localhost:9000");
        minio.setAccessKey(OssCredentialGuard.INSECURE_DEV_ACCESS_KEY);
        minio.setSecretKey(OssCredentialGuard.INSECURE_DEV_SECRET_KEY);
        assertDoesNotThrow(() -> OssCredentialGuard.assertSafeForProfile(minio, env));
    }

    @Test
    void prodAllowsRotatedSecrets() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        OssProperties.MinioConfiguration minio = new OssProperties.MinioConfiguration();
        minio.setEndpoint("https://objects.example");
        minio.setAccessKey("prod-ak");
        minio.setSecretKey("prod-sk-not-default");
        assertDoesNotThrow(() -> OssCredentialGuard.assertSafeForProfile(minio, env));
    }
}
