package com.erdonline.common.websocket.socketio.util;

import cn.hutool.core.util.StrUtil;
import com.corundumstudio.socketio.HandshakeData;
import com.erdonline.common.core.constant.SecurityConstants;
import com.erdonline.common.core.constant.WebsocketConstants;
import com.erdonline.common.core.support.SpringContextHelper;
import com.erdonline.erd.socketio.SocketTicketPrincipal;
import com.erdonline.erd.socketio.SocketTicketService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

/**
 * Socket handshake query 解析。
 */
@Slf4j
public class ParseHeaderUtil {
    public static String parseTokenFromHeader(HandshakeData handshakeData) {
        return handshakeData.getSingleUrlParam(WebsocketConstants.TOKEN);
    }

    public static String parseTicketFromHeader(HandshakeData handshakeData) {
        return handshakeData.getSingleUrlParam(WebsocketConstants.TICKET);
    }

    public static String parseUserNameFromHeader(HandshakeData handshakeData) {
        SocketTicketPrincipal principal = resolveTicketPrincipal(handshakeData);
        if (principal != null) {
            return principal.username();
        }
        return handshakeData.getSingleUrlParam(WebsocketConstants.USER_NAME);
    }

    /** Prefer ticket payload; JWT claim {@code user_id} as fallback. */
    public static String parseUserIdFromHeader(HandshakeData handshakeData) {
        SocketTicketPrincipal principal = resolveTicketPrincipal(handshakeData);
        if (principal != null) {
            return principal.userId();
        }
        String token = parseTokenFromHeader(handshakeData);
        if (StrUtil.isBlank(token) || token.length() > 512) {
            return null;
        }
        try {
            JwtDecoder decoder = SpringContextHelper.getBean(JwtDecoder.class);
            Jwt jwt = decoder.decode(token);
            Object claim = jwt.getClaim(SecurityConstants.TOKEN_USER_ID);
            return claim == null ? null : String.valueOf(claim);
        } catch (Exception e) {
            log.warn("resolve userId from jwt failed: {}", e.getMessage());
            return null;
        }
    }

    public static String parseProjectIdFromHeader(HandshakeData handshakeData) {
        return handshakeData.getSingleUrlParam(WebsocketConstants.PROJECT_ID);
    }

    private static SocketTicketPrincipal resolveTicketPrincipal(HandshakeData handshakeData) {
        String ticket = parseTicketFromHeader(handshakeData);
        if (StrUtil.isBlank(ticket)) {
            return null;
        }
        try {
            SocketTicketService tickets = SpringContextHelper.getBean(SocketTicketService.class);
            return tickets.resolve(ticket).orElse(null);
        } catch (Exception e) {
            log.warn("resolve ticket principal failed: {}", e.getMessage());
            return null;
        }
    }
}
