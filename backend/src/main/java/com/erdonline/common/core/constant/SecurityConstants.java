package com.erdonline.common.core.constant;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/3/1 11:17
 * @describtion SecurityConstants
 * @since 1.0
 */
public final class SecurityConstants {
    private SecurityConstants() {
    }

    /**
     * 前缀
     */
    public static final String MARTIN_PREFIX = CommonConstants.MARTIN + "_";

    /**
     * oauth 相关前缀
     */
    public static final String OAUTH_PREFIX = "oauth:";
    /**
     * 项目的license
     */
    public static final String MARTIN_LICENSE = "零代科技";


    /**
     * 标志
     */
    public static final String MARTIN_INNER = CommonConstants.MARTIN + "-inner";

    /**
     * {bcrypt} 加密的特征码
     */
    public static final String BCRYPT = "{bcrypt}";
    public static final String LDAP = "{ldap}";
    public static final String MD4 = "{MD4}";
    public static final String MD5 = "{MD5}";
    public static final String NOOP = "{noop}";
    public static final String PBKDF2 = "{pbkdf2}";
    public static final String SCRYPT = "{scrypt}";
    public static final String SHA_1 = "{SHA-1}";
    public static final String SHA_256 = "{SHA-256}";
    public static final String SHA256 = "{sha256}";


    /**
     * 客户端模式
     */
    public static final String CLIENT_CREDENTIALS = "client_credentials";

    /**
     * 用户ID字段
     */
    public static final String TOKEN_USER_ID = "user_id";

    /**
     * 用户名字段
     */
    public static final String TOKEN_USERNAME = "username";

    /**
     * 用户部门字段
     */
    public static final String TOKEN_DEPT_ID = "dept_id";

    /**
     * 用户角色字段
     */
    public static final String TOKEN_ROLE_IDS = "role_ids";

    /**
     * 租户ID 字段
     */
    public static final String TOKEN_TENANT_ID = "tenant_id";

    /**
     * 协议字段
     */
    public static final String TOKEN_LICENSE = "license";

    /**
     * 授权给
     */
    public static final String LICENSE_TO = "licensedTo";

    /**
     * 授权开始时间
     */
    public static final String LICENSED_START_TIME = "licensedStartTime";

    /**
     * 授权结束时间
     */
    public static final String LICENSED_END_TIME = "licensedEndTime";


}
