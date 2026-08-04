package com.erdonline.common.core.api;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/8/22
 * @describtion ApiErrorCode
 * @since 1.0
 */
public enum ApiErrorCode implements IErrorCode {
    FAIL(500, "操作发生错误，请联系管理员"),

    OK(200, "操作成功"),

    BAD_REQUEST(400, "客户端异常"),

    UNAUTHORIZED(401, "用户没有权限（令牌、用户名、密码错误）"),

    FORBIDDEN(403, "当前用户权限不够，无法操作此功能"),

    NOT_FOUND(404, "资源不存在"),

    PROJECT_SAVE_CONFLICT(409, "项目已被其他窗口或协作者更新，请刷新后再保存"),

    /** 同 project + db_key 下版本号已被占用（db_change 唯一约束） */
    VERSION_SAVE_DUPLICATE(409001, "该版本号已被占用，请改用更大的版本号或刷新版本列表后重试"),

    METHOD_NOT_ALLOWED(405, "request请求方法不支持"),

    PAGE_LIMIT_ERROR(1000001, "分页参数过大"),

    METHOD_NOT_IMPLEMENT(1000002, "方法没有具体的实现"),

    USER_NOT_FOUND(9404001, "查无此用户"),

    ROLE_NOT_FOUND(9404002, "用户未分配角色"),

    PRIVILEGE_NOT_FOUND(9404003, "用户未授权"),

    ERROR_USERNAME_OR_PASSWORD(9404004, "用户名不存在或者密码错误"),

    INVALID_TOKEN(9404005, "TOKEN无效或已过期"),

    OAUTH_ERROR(9404006, "oauth认证异常"),
    GLOBAL_REGISTER_PERSON_COUNT(888801, "注册人数超过5个"),

    ;


    private final int code;
    private final String msg;

    /**
     * 初始化
     *
     * @param code 错误码
     * @param msg  错误信息
     */
    ApiErrorCode(final int code, final String msg) {
        this.code = code;
        this.msg = msg;
    }

    public static ApiErrorCode fromCode(int code) {
        ApiErrorCode[] ecs = values();
        ApiErrorCode[] var3 = ecs;
        int var4 = ecs.length;

        for (int var5 = 0; var5 < var4; ++var5) {
            ApiErrorCode ec = var3[var5];
            if (ec.getCode() == code) {
                return ec;
            }
        }

        return OK;
    }

    @Override
    public int getCode() {
        return this.code;
    }

    @Override
    public String getMsg() {
        return this.msg;
    }

    @Override
    public String toString() {
        return String.format(" ErrorCode:{code=%s, msg=%s} ", this.code, this.msg);
    }
}
