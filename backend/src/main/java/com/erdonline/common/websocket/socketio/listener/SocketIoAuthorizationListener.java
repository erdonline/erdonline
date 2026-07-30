package com.erdonline.common.websocket.socketio.listener;

import cn.hutool.core.util.StrUtil;
import com.corundumstudio.socketio.AuthorizationListener;
import com.corundumstudio.socketio.HandshakeData;
import com.erdonline.common.websocket.socketio.util.ParseHeaderUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.common.exceptions.InvalidTokenException;
import org.springframework.security.oauth2.provider.OAuth2Authentication;
import org.springframework.security.oauth2.provider.token.DefaultTokenServices;
import org.springframework.stereotype.Component;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/7/23
 * @describtion SocketIoAuthorizationListener
 * @since 1.0
 */
@Slf4j
@Component
public class SocketIoAuthorizationListener implements AuthorizationListener {
    @Autowired
    private DefaultTokenServices remoteTokenServices;

    @Override
    public boolean isAuthorized(HandshakeData handshakeData) {
        String token = ParseHeaderUtil.parseTokenFromHeader(handshakeData);
        // 可以使用如下代码获取用户密码信息
        if (StrUtil.isBlank(token)) {
            log.info(" token为null");
            return false;
        }
        try {
            OAuth2Authentication oAuth2Authentication = remoteTokenServices.loadAuthentication(token);
            if (oAuth2Authentication == null) {
                log.info("oAuth2Authentication为null");
                return false;
            }
            Object principal = oAuth2Authentication.getPrincipal();
//            if (principal == null) {
//                log.info("principal为null");
//                return false;
//            }
        } catch (AuthenticationException e) {
            log.error("", e);
            return false;
        } catch (InvalidTokenException e) {
            log.error("", e);
            return false;
        }
        log.info("token 有效");
        return true;
    }


}
