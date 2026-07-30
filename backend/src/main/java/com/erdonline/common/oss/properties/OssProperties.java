package com.erdonline.common.oss.properties;

import lombok.Data;
import lombok.ToString;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/7/26
 * @describtion OssProperties
 * @since 1.0
 */
@Data
@ToString
@ConfigurationProperties("martin.oss")
public class OssProperties {
    private boolean enabled;
    private MinioConfiguration minio;
    private TencentConfiguration tencent;


    @Data
    public static class MinioConfiguration {
        private String endpoint;
        private String accessKey;
        private String secretKey;
    }

    @Data
    public static class TencentConfiguration {
        private String endpoint;
        private String secretId;
        private String secretKey;
        private String region;

    }
}
