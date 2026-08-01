package com.erdonline.auth.endpint;

import com.erdonline.common.core.api.R;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * JWT 无状态登出：仅返回成功，不依赖服务端会话。
 */
class TokenServiceTest {

    private final TokenService tokenService = new TokenService();

    @Test
    void removeTokenAlwaysSucceeds() {
        R r = tokenService.removeToken("Bearer abc");
        assertTrue(r.valid());
        assertEquals("退出成功", r.getData());
    }
}
