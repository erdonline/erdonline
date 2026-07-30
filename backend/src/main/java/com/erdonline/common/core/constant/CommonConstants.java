package com.erdonline.common.core.constant;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/2/28 10:43
 * @describtion CommonConstants
 * @since 1.0
 */
public final class CommonConstants {
    private CommonConstants() {
    }

    /**
     * 项目标识
     */
    public static final String MARTIN = "martin";

    /**
     * 正常
     */
    public static final String STATUS_NORMAL = "0";
    /**
     * 锁定
     */
    public static final String STATUS_LOCK = "1";
    /**
     * 未审核
     */
    public static final String STATUS_NO_APPROVE = "2";

    /**
     * 菜单根节点标识
     */
    public static final Integer MENU_ROOT = 0;

    /**
     * 创建时间
     */
    public static final String CREATE_TIME = "createTime";
    /**
     * 创建人
     */
    public static final String CREATOR = "creator";
    /**
     * 修改时间
     */
    public static final String UPDATE_TIME = "updateTime";
    /**
     * 修改人
     */
    public static final String UPDATER = "updater";
    /**
     * 系统常用增删改查，中文
     */
    public static final String[] CRUD_CN = {"新增", "删除", "修改", "查询", "分页", "批量删除"};
    /**
     * 系统常用增删改查，字段数
     */
    public static final int CRUD_SIZE = CRUD_CN.length;
    /**
     * 系统常用增删改查，英文
     */
    public static final String[] CRUD_EN = {"add", "del", "edit", "get", "page", "deleteBatch"};
    /**
     * 系统默认字典service在spring中的名字
     */
    public static final String DICT_SERVICE = "dictServiceImpl";
    /**
     * 系统默认主键字段
     */
    public static final String PRIMARY_KRY = "id";
    /**
     * entity字段做绑定时，替换外键末尾的ID为 BIND_SUFFIX
     */
    public static final String BIND_SUFFIX = "Name";
    /**
     * 数据库外键结尾字符
     */
    public static final String FK_SUFFIX = "Id";
    /**
     * 用户表中的用户名字段
     */
    public static final String USER_USERNAME = "username";

    /**
     * null字符串
     */
    public static final String NULL = "null";

    /**
     * null字符串
     */
    public static final String ERD_USER_NEW = "ERD_USER_NEW";
}
