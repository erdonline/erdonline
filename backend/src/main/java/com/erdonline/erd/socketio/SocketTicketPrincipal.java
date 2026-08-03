package com.erdonline.erd.socketio;

/**
 * Socket.IO 短票载荷：userId 供项目成员校验，username 供 presence 展示。
 */
public record SocketTicketPrincipal(String userId, String username) {
}
