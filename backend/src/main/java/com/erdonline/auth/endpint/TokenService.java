package com.erdonline.auth.endpint;

import cn.hutool.core.util.StrUtil;
import com.erdonline.common.core.api.R;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.common.OAuth2AccessToken;
import org.springframework.security.oauth2.common.OAuth2RefreshToken;
import org.springframework.security.oauth2.provider.token.TokenStore;
import org.springframework.stereotype.Service;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/5/17
 * @describtion TokenService
 * @since 1.0
 */
@Slf4j
@Service
public class TokenService {
    @Autowired
    private TokenStore tokenStore;


    /**
     * 退出登录清除token
     *
     * @param authHeader
     * @return
     */
    public R removeToken(String authHeader) {
        log.info("authHeader: {}", authHeader);
        if (StrUtil.isBlank(authHeader)) {
            return R.failed("退出失败，token 为空");
        }
        String token = authHeader.replace(OAuth2AccessToken.BEARER_TYPE, StrUtil.EMPTY).trim();

        OAuth2AccessToken accessToken = tokenStore.readAccessToken(token);
        if (accessToken == null || StrUtil.isBlank(accessToken.getValue())) {
            return R.failed("退出失败，token 无效");
        }

        // 清空access token
        tokenStore.removeAccessToken(accessToken);

        // 清空 refresh token
        OAuth2RefreshToken refreshToken = accessToken.getRefreshToken();
        tokenStore.removeRefreshToken(refreshToken);
        return R.ok("退出成功");
    }


}
