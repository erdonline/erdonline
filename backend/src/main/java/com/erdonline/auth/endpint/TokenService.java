package com.erdonline.auth.endpint;

import com.erdonline.common.core.api.R;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * JWT 无服务端会话：登出由前端丢弃 token 即可。
 */
@Slf4j
@Service
public class TokenService {
    public R removeToken(String authHeader) {
        log.info("logout (stateless JWT), header present={}", authHeader != null);
        return R.ok("退出成功");
    }
}
