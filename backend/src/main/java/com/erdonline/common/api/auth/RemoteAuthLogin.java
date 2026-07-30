package com.erdonline.common.api.auth;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/8/6
 * @describtion RemoteAuthLogin —— 单体化后由 auth 模块本地实现（LocalAuthLoginService）取代原 Feign 远程调用
 * @since 1.0
 */
public interface RemoteAuthLogin {
    /**
     * 社交登录生成本系统的token
     *
     * @param username 用户名
     * @param password 密码
     * @return OAuth2 token 信息
     */
    Object socialLoginToken(String username, String password);
}
