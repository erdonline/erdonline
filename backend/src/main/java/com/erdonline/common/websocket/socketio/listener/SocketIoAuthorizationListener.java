package com.erdonline.common.websocket.socketio.listener;

import cn.hutool.core.util.StrUtil;
import com.corundumstudio.socketio.AuthorizationListener;
import com.corundumstudio.socketio.HandshakeData;
import com.erdonline.common.websocket.socketio.util.ParseHeaderUtil;
import com.erdonline.erd.socketio.SocketTicketService;
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

    @Autowired
    private SocketTicketService socketTicketService;

    @Override
    public boolean isAuthorized(HandshakeData handshakeData) {
        String ticket = ParseHeaderUtil.parseTicketFromHeader(handshakeData);
        if (StrUtil.isNotBlank(ticket)) {
            boolean ok = socketTicketService.resolveUsername(ticket).isPresent();
            if (!ok) {
                log.info("socket ticket invalid");
            }
            return ok;
        }
        String token = ParseHeaderUtil.parseTokenFromHeader(handshakeData);
        if (StrUtil.isBlank(token)) {
            return false;
        }
        // 超长 JWT 会撑爆 handshake URL；仅兼容短 token / 调试
        if (token.length() > 512) {
            log.info("socket jwt too long ({}), use /auth/socket-ticket", token.length());
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
