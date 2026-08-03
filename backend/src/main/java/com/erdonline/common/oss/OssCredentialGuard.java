package com.erdonline.common.oss;

import com.erdonline.common.oss.properties.OssProperties;
import org.springframework.core.env.Environment;
import org.springframework.util.StringUtils;

import java.util.Arrays;

/**
 * MinIO / OSS 凭证门禁（R-CFG-05）。
 * <p>
 * MinIO 可选：endpoint 为空不建客户端。prod 启用时拒绝 blank 与仓库已知弱默认对
 * {@code minio}/{@code minio123}。
 */
public final class OssCredentialGuard {

    /** 常见 MinIO 安装默认 access key（仅 DX；勿进 prod）。 */
    public static final String INSECURE_DEV_ACCESS_KEY = "minio";
    /** 常见 MinIO 安装默认 secret（仅 DX；勿进 prod）。 */
    public static final String INSECURE_DEV_SECRET_KEY = "minio123";

    private OssCredentialGuard() {
    }

    /**
     * @param minio 可为 null（等同未启用）
     */
    public static void assertSafeForProfile(OssProperties.MinioConfiguration minio, Environment env) {
        if (minio == null || !StringUtils.hasText(minio.getEndpoint())) {
            return;
        }
        boolean prod = Arrays.asList(env.getActiveProfiles()).contains("prod");
        if (!prod) {
            return;
        }
        String access = minio.getAccessKey() == null ? "" : minio.getAccessKey().trim();
        String secret = minio.getSecretKey() == null ? "" : minio.getSecretKey().trim();
        if (!StringUtils.hasText(access) || !StringUtils.hasText(secret)) {
            throw new IllegalStateException(
                    "martin.oss.minio credentials blank: set OSS_ACCESS_KEY / OSS_SECRET_KEY when OSS_ENDPOINT is set in prod");
        }
        if (INSECURE_DEV_ACCESS_KEY.equals(access) && INSECURE_DEV_SECRET_KEY.equals(secret)) {
            throw new IllegalStateException(
                    "OSS credentials must not use MinIO install defaults (minio/minio123) in prod; rotate secrets");
        }
    }
}
