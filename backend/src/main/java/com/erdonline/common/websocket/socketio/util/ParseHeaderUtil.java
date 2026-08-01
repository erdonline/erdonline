package com.erdonline.common.websocket.socketio.util;

import cn.hutool.core.util.StrUtil;
import com.corundumstudio.socketio.HandshakeData;
import com.erdonline.common.core.constant.WebsocketConstants;
import com.erdonline.common.core.support.SpringContextHelper;
import com.erdonline.erd.socketio.SocketTicketService;
import lombok.extern.slf4j.Slf4j;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/7/24
 * @describtion ParseHeaderUtil
 * @since 1.0
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
        String ticket = parseTicketFromHeader(handshakeData);
        if (StrUtil.isNotBlank(ticket)) {
            try {
                SocketTicketService tickets = SpringContextHelper.getBean(SocketTicketService.class);
                return tickets.resolveUsername(ticket).orElse(null);
            } catch (Exception e) {
                log.warn("resolve username from ticket failed: {}", e.getMessage());
            }
        }
        return handshakeData.getSingleUrlParam(WebsocketConstants.USER_NAME);
    }

    public static String parseProjectIdFromHeader(HandshakeData handshakeData) {
        return handshakeData.getSingleUrlParam(WebsocketConstants.PROJECT_ID);
    }
}
