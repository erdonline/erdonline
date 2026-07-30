package com.erdonline.common.core.constant;

import ch.qos.logback.classic.db.names.ColumnName;
import cn.hutool.core.util.RandomUtil;

import java.util.Map;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/8/2
 * @describtion SocialLoginConstants
 * @since 1.0
 */
public final class SocialLoginConstants {
    private SocialLoginConstants() {
    }

    /**
     * 社交登录 openid 参数
     */
    public static final String OPENID = "openid";

    /**
     * 社交登录 openid 列
     */
    public static final String OPENID_COLUMN = "column";

    /**
     * 社交登录类型
     */
    public static final String SOCIAL_TYPE = "socialType";

    /**
     * 生成加密的随机数
     */
    public static final String BASE_CHAR = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    /**
     * 新注册的用户，分配的角色
     */
    public final static String ROLE_NEW_REGISTER = "ROLE_NEW_REGISTER";

    /**
     * 特定社交类型，分配的角色
     */
    public final static String ROLE_WECHAT_REGISTER = "ROLE_{}_REGISTER";

    /**
     * 生成加密的随机数
     */
    public static final String INIT_PASSWORD = "zerocode";

    /**
     * 随机生成用户名
     *
     * @param openid         社交登录返回的 openid
     * @param baseCharLength 随机数取多少个，推荐设为5
     * @param openidLength   openid取多少个，推荐设为4
     * @return
     */
    public static String randomUserName(String openid, int baseCharLength, int openidLength) {
        return RandomUtil.randomString(BASE_CHAR, baseCharLength) + RandomUtil.randomString(openid, openidLength);
    }

}
