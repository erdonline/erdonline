package com.erdonline.auth.federate;

/**
 * IdP 归一化身份（登录/绑定共用）。
 */
public record FederateIdentity(
        FederateProvider provider,
        String subject,
        String unionId,
        String email,
        boolean emailVerified,
        String displayName
) {
}
