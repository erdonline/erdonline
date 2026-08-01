package com.erdonline.auth.endpint;

import com.erdonline.common.core.api.R;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * /exit 登出入口。
 */
@ExtendWith(MockitoExtension.class)
class AuthEndpointTest {

    @Mock
    private TokenService tokenService;

    @InjectMocks
    private AuthEndpoint authEndpoint;

    @Test
    void logoutDelegatesToTokenService() {
        when(tokenService.removeToken("Bearer t")).thenReturn(R.ok("退出成功"));
        R r = authEndpoint.logout("Bearer t");
        assertEquals("退出成功", r.getData());
        verify(tokenService).removeToken("Bearer t");
    }
}
