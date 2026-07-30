package com.erdonline.common.core.constant;

import cn.hutool.core.util.StrUtil;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/7/27
 * @describtion OssConstants
 * @since 1.0
 */
public final class OssConstants {
    private OssConstants() {
    }

    /**
     * 默认桶
     */
    public static final String DEFAULT_BUCKET = CommonConstants.MARTIN;

    /**
     * 默认word模板路径
     */
    public static final String DEFAULT_WORD_PATH = DEFAULT_BUCKET + StrUtil.SLASH + "default" + StrUtil.SLASH + "defaultWorldTemplate.docx";

    /**
     * 默认桶
     */
    public static final String DEFAULT_PROJECT = "project";

    /**
     * ERD 模块存储桶位置
     */
    public static final String PROJECT_MODULE_ERD_BUCKET = DEFAULT_PROJECT + "erd/";
}
