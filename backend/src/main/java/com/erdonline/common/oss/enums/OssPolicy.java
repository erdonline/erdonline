package com.erdonline.common.oss.enums;

import lombok.AllArgsConstructor;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/7/26
 * @describtion OssTypeEnum
 * @since 1.0
 */
@AllArgsConstructor
public enum OssPolicy {
    /**
     * 只读
     */
    READ_ONLY(0),
    /**
     * 只写
     */
    WRITE_ONLY(1),

    /**
     * 读写
     */
    READ_WRITE(2);


    public int type;
    }
