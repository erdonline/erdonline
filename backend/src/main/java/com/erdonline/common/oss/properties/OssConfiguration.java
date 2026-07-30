package com.erdonline.common.oss.properties;

import lombok.Data;
import lombok.ToString;

/**
 * @author: 零代科技
 * @version: 1.0
 * @date: 2023/12/17 19:43
 * @describtion: OssConfiguration
 */
@Data
@ToString
public class OssConfiguration {
    /**
     * 文件系统类型
     */
    private String type;

    /**
     * 文件服务器url
     */
    private String endpoint;

    /**
     * 密钥id
     */
    private String secretId;

    /**
     * accessKey
     */
    private String accessKey;

    /**
     * 密钥key
     */
    private String secretKey;

    /**
     * 地域
     */
    private String region;

    /**
     * 临时登录token
     */
    private String token;

    private String prefix;
}
