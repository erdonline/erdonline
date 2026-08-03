package com.erdonline.common.websocket.socketio.listener;

import cn.hutool.core.util.StrUtil;
import com.corundumstudio.socketio.AuthorizationListener;
import com.corundumstudio.socketio.HandshakeData;
import com.erdonline.common.core.constant.SecurityConstants;
import com.erdonline.common.websocket.socketio.util.ParseHeaderUtil;
import com.erdonline.erd.security.ProjectAcl;
import com.erdonline.erd.socketio.SocketTicketPrincipal;
import com.erdonline.erd.socketio.SocketTicketService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Component;

/**
 * Socket 握手：短票/JWT 有效且当前用户 ∈ {@code project_user}（R-AUTH-05）。
 */
@Slf4j
@Component
public class SocketIoAuthorizationListener implements AuthorizationListener {
    @Autowired
    private JwtDecoder jwtDecoder;

    @Autowired
    private SocketTicketService socketTicketService;

    @Autowired
    private ProjectAcl projectAcl;

    @Override
    public boolean isAuthorized(HandshakeData handshakeData) {
        String projectId = ParseHeaderUtil.parseProjectIdFromHeader(handshakeData);
        if (StrUtil.isBlank(projectId)) {
            log.info("socket reject: missing projectId");
            return false;
        }

        String userId = resolveUserId(handshakeData);
        if (StrUtil.isBlank(userId)) {
            return false;
        }
        if (!projectAcl.isMember(projectId, userId)) {
            log.info("socket reject: user {} not member of project {}", userId, projectId);
            return false;
        }
        return true;
    }

    private String resolveUserId(HandshakeData handshakeData) {
        String ticket = ParseHeaderUtil.parseTicketFromHeader(handshakeData);
        if (StrUtil.isNotBlank(ticket)) {
            return socketTicketService.resolve(ticket)
                    .map(SocketTicketPrincipal::userId)
                    .orElseGet(() -> {
                        log.info("socket ticket invalid");
                        return null;
                    });
        }
        String token = ParseHeaderUtil.parseTokenFromHeader(handshakeData);
        if (StrUtil.isBlank(token)) {
            return null;
        }
        if (token.length() > 512) {
            log.info("socket jwt too long ({}), use /auth/socket-ticket", token.length());
            return null;
        }
        try {
            Jwt jwt = jwtDecoder.decode(token);
            Object claim = jwt.getClaim(SecurityConstants.TOKEN_USER_ID);
            return claim == null ? null : String.valueOf(claim);
        } catch (JwtException e) {
            log.info("socket jwt invalid: {}", e.getMessage());
            return null;
        }
    }
}
