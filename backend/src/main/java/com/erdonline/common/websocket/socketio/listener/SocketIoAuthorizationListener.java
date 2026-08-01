package com.erdonline.common.websocket.socketio.listener;

import cn.hutool.core.util.StrUtil;
import com.corundumstudio.socketio.AuthorizationListener;
import com.corundumstudio.socketio.HandshakeData;
import com.erdonline.common.websocket.socketio.util.ParseHeaderUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class SocketIoAuthorizationListener implements AuthorizationListener {
    @Autowired
    private JwtDecoder jwtDecoder;

    @Override
    public boolean isAuthorized(HandshakeData handshakeData) {
        String token = ParseHeaderUtil.parseTokenFromHeader(handshakeData);
        if (StrUtil.isBlank(token)) {
            return false;
        }
        try {
            jwtDecoder.decode(token);
            return true;
        } catch (JwtException e) {
            log.info("socket jwt invalid: {}", e.getMessage());
            return false;
        }
    }
}
