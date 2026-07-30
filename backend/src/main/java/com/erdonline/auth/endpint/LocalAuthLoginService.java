package com.erdonline.auth.endpint;

import com.erdonline.common.api.auth.RemoteAuthLogin;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.common.OAuth2AccessToken;
import org.springframework.security.oauth2.provider.endpoint.TokenEndpoint;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * RemoteAuthLogin 的本地实现（单体化后取代原 Feign 远程调用 /oauth/token）。
 *
 * 复用 OAuth2 授权服务器内建的 {@link TokenEndpoint}，走与 HTTP 端点完全一致的
 * 密码模式令牌签发流程（含 tokenEnhancer、租户、RedisTokenStore），保证行为不变。
 *
 * @see com.erdonline.auth.config.AuthorizationServerConfiguration
 */
@Slf4j
@Service
public class LocalAuthLoginService implements RemoteAuthLogin {

    /** 社交登录使用的客户端，对应 db 中 oauth_client_details 的 password 模式客户端 */
    private static final String CLIENT_ID = "client2";
    private static final String GRANT_TYPE = "password";
    private static final String SCOPE = "select";

    @Autowired
    private TokenEndpoint tokenEndpoint;

    @Override
    public Object socialLoginToken(String username, String password) {
        // 构造一个已认证的 client 主体，等价于 HTTP 端点里 Basic Auth 解析出的 client
        UsernamePasswordAuthenticationToken principal = new UsernamePasswordAuthenticationToken(
                CLIENT_ID, null, AuthorityUtils.NO_AUTHORITIES);

        Map<String, String> params = new HashMap<>(8);
        params.put("grant_type", GRANT_TYPE);
        params.put("scope", SCOPE);
        params.put("username", username);
        params.put("password", password);

        try {
            OAuth2AccessToken token = tokenEndpoint.postAccessToken(principal, params).getBody();
            LinkedHashMap<String, Object> result = new LinkedHashMap<>();
            if (token != null) {
                result.put("access_token", token.getValue());
                result.put("token_type", token.getTokenType());
                if (token.getRefreshToken() != null) {
                    result.put("refresh_token", token.getRefreshToken().getValue());
                }
                result.put("expires_in", token.getExpiresIn());
                result.put("scope", String.join(" ", token.getScope()));
                if (token.getAdditionalInformation() != null) {
                    result.putAll(token.getAdditionalInformation());
                }
            }
            return result;
        } catch (Exception e) {
            log.error("本地社交登录签发 token 失败, username: {}", username, e);
            return new LinkedHashMap<>();
        }
    }
}
