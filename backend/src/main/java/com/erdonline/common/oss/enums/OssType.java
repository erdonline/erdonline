package com.erdonline.common.oss.enums;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/7/26
 * @describtion OssTypeEnum
 * @since 1.0
 */
@AllArgsConstructor
public enum OssType {
    /**
     * Minio
     */
    LOCAL("0"),
    /**
     * 七牛
     */
    QINIU("1"),

    /**
     * 阿里
     */
    ALI("2"),

    /**
     * 腾讯
     */
    TENCENT("2");

    public String type;
}
