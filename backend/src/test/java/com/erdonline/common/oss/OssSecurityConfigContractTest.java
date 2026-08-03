package com.erdonline.common.oss;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * R-CFG-05 / R-CFG-06：无仓库 OSS 弱默认；yml 走嵌套 minio；.env.example 无 OAuth 死键。
 */
class OssSecurityConfigContractTest {

    private static final Path APP_YML = Path.of("src/main/resources/application.yml");
    private static final Path PROD_YML = Path.of("src/main/resources/application-prod.yml");
    private static final Path ENV_EXAMPLE = Path.of("../.env.example");

    @Test
    void applicationYmlHasNoCommittedMinioDefaultSecrets() throws IOException {
        String yml = Files.readString(APP_YML);
        assertFalse(yml.contains("minio123"), "must not commit MinIO default secret minio123");
        assertFalse(yml.contains("OSS_ACCESS_KEY:minio"), "must not default OSS_ACCESS_KEY to minio");
        assertFalse(yml.contains("OSS_SECRET_KEY:minio123"), "must not default OSS_SECRET_KEY to minio123");
        assertTrue(yml.contains("minio:"), "credentials must nest under martin.oss.minio");
        assertTrue(yml.contains("endpoint: ${OSS_ENDPOINT:}"), "endpoint optional via empty default");
        assertTrue(yml.contains("accessKey: ${OSS_ACCESS_KEY:}"), "accessKey empty default (no secret in repo)");
        assertTrue(yml.contains("secretKey: ${OSS_SECRET_KEY:}"), "secretKey empty default (no secret in repo)");
    }

    @Test
    void prodYmlDoesNotForceOrphanFlatOssPlaceholders() throws IOException {
        String prod = Files.readString(PROD_YML);
        // 旧扁平 martin.oss.accessKey: ${OSS_ACCESS_KEY} 强迫每人填假密钥且绑不到 MinioClient
        assertFalse(prod.matches("(?s).*\\nmartin:\\n(?:  [^\\n]+\\n)*  oss:\\n\\s+accessKey:.*"),
                "prod must not force flat martin.oss.accessKey placeholders");
        assertFalse(prod.contains("accessKey: ${OSS_ACCESS_KEY}"),
                "prod must not require OSS_ACCESS_KEY when MinIO unused");
        assertFalse(prod.contains("secretKey: ${OSS_SECRET_KEY}"),
                "prod must not require OSS_SECRET_KEY when MinIO unused");
    }

    @Test
    void envExampleDropsDeadOAuthClientKeys() throws IOException {
        String env = Files.readString(ENV_EXAMPLE);
        assertFalse(env.contains("OAUTH_CLIENT_ID"), "OAUTH_CLIENT_ID is dead (JWT auth)");
        assertFalse(env.contains("OAUTH_CLIENT_SECRET"), "OAUTH_CLIENT_SECRET is dead (JWT auth)");
        assertFalse(env.contains("oauth_client_details"), "do not point ops at removed OAuth client table wiring");
    }
}
