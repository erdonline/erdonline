package com.erdonline.common.oss;

import com.erdonline.common.oss.properties.OssProperties;
import com.qcloud.cos.COSClient;
import com.qcloud.cos.ClientConfig;
import com.qcloud.cos.auth.BasicCOSCredentials;
import com.qcloud.cos.auth.COSCredentials;
import com.qcloud.cos.http.HttpProtocol;
import com.qcloud.cos.region.Region;
import io.minio.MinioClient;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/7/26
 * @describtion MartinOssAutoConfiguration
 * @since 1.0
 */
@Slf4j
@Configuration
@EnableAsync
@AllArgsConstructor
@ConditionalOnWebApplication
@EnableConfigurationProperties({OssProperties.class})
@ConditionalOnProperty(
        prefix = "martin.oss",
        name = {"enabled"},
        havingValue = "true",
        matchIfMissing = true
)
@ComponentScan(basePackages = {"com.erdonline.common.oss", "com.erdonline.common.core"})
public class MartinOssAutoConfiguration {
    @Autowired
    private OssProperties ossProperties;

    @Bean
    @ConditionalOnProperty(name = "martin.oss.minio.endpoint")
    public MinioClient minioClient() {
        OssProperties.MinioConfiguration minioConfiguration = ossProperties.getMinio();
        return MinioClient.builder()
                .endpoint(minioConfiguration.getEndpoint())
                .credentials(minioConfiguration.getAccessKey(), minioConfiguration.getSecretKey())
                .build();
    }

    @Bean
    @ConditionalOnProperty(name = "martin.oss.tencent.secretId")
    public COSClient tencentOssClient() {
        OssProperties.TencentConfiguration tencentConfiguration = ossProperties.getTencent();

        // 1 初始化用户身份信息（secretId, secretKey）。
        // SECRETID 和 SECRETKEY 请登录访问管理控制台 https://console.cloud.tencent.com/cam/capi 进行查看和管理
        String secretId = tencentConfiguration.getSecretId();//用户的 SecretId，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。子账号密钥获取可参见 https://cloud.tencent.com/document/product/598/37140
        String secretKey = tencentConfiguration.getSecretKey();//用户的 SecretKey，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。子账号密钥获取可参见 https://cloud.tencent.com/document/product/598/37140
        COSCredentials cred = new BasicCOSCredentials(secretId, secretKey);
        // 2 设置 bucket 的地域, COS 地域的简称请参见 https://cloud.tencent.com/document/product/436/6224
        // clientConfig 中包含了设置 region, https(默认 http), 超时, 代理等 set 方法, 使用可参见源码或者常见问题 Java SDK 部分。"COS_REGION"
        Region region = new Region(tencentConfiguration.getRegion());
        ClientConfig clientConfig = new ClientConfig(region);
        // 这里建议设置使用 https 协议
        // 从 5.6.54 版本开始，默认使用了 https
        clientConfig.setHttpProtocol(HttpProtocol.https);
        // 3 生成 cos 客户端。
        COSClient cosClient = new COSClient(cred, clientConfig);
        return cosClient;
    }

}
