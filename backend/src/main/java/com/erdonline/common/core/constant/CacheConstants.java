package com.erdonline.common.core.constant;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/8/27
 * @describtion CacheConstants，所有缓存都放到martin这个顶级标签下，和其他缓存做区分
 * @since 1.0
 */
public final class CacheConstants {
    private CacheConstants(){}
    /**
     * 菜单信息缓存
     */
    public static final String MENU_DETAILS = CommonConstants.MARTIN + ":menu_details";

    /**
     * 用户信息缓存
     */
    public static final String USER_DETAILS = CommonConstants.MARTIN + ":user_details";

    /**
     * 字典信息缓存
     */
    public static final String DICT_DETAILS = CommonConstants.MARTIN + ":dict_details";


    /**
     * oauth 客户端信息
     */
    public static final String CLIENT_DETAILS_KEY = CommonConstants.MARTIN + ":oauth2:client_details";


    /**
     * spring boot admin 事件key
     */
    public static final String EVENT_KEY = CommonConstants.MARTIN + ":event_key";

    /**
     * 路由存放
     */
    public static final String ROUTE_KEY = CommonConstants.MARTIN + ":gateway_route_key";

    /**
     * 参数缓存
     */
    public static final String PARAMS_DETAILS = CommonConstants.MARTIN + ":params_details";

    /**
     * 租户缓存
     */
    public static final String TENANT_DETAILS = CommonConstants.MARTIN + ":tenant_details";


    /**
     * 用户权限、url缓存
     */
    public static final String USER_SECURITY_URL = CommonConstants.MARTIN + ":user:security_url";

    /**
     * 全量用户权限、url缓存
     */
    public static final String USER_SECURITY_URL_ALL = "all";

    /**
     * 分布式订单号生成
     */
    public static final String ORDER_NO = CommonConstants.MARTIN + ":order_no:";

}
