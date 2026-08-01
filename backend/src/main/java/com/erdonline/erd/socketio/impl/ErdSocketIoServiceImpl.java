package com.erdonline.erd.socketio.impl;

import cn.hutool.core.util.StrUtil;
import com.corundumstudio.socketio.AckRequest;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIONamespace;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.handler.SocketIOException;
import com.corundumstudio.socketio.listener.DataListener;
import com.corundumstudio.socketio.listener.DisconnectListener;
import com.erdonline.common.core.constant.WebsocketConstants;
import com.erdonline.common.core.support.SpringContextHelper;
import com.erdonline.common.websocket.socketio.util.ParseHeaderUtil;
import com.erdonline.common.websocket.socketio.vo.JoinLeaveRoomVo;
import com.erdonline.erd.socketio.ErdSocketIoService;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 项目协作 SocketIO：进房/离房/断线清名单（ADR-0009）。
 */
@Slf4j
@Service
@RestController
public class ErdSocketIoServiceImpl implements ErdSocketIoService {
    private final String MODULE = WebsocketConstants.PROJECT_NAMESPACE + "/erd";

    private static final String ATTR_USERNAME = "erd.presence.username";
    private static final String ATTR_PROJECT = "erd.presence.projectId";

    @Autowired
    SocketIOServer socketIOServer;

    @Override
    public SocketIOServer setEvent(SocketIOServer socketIOServer) {
        return socketIOServer;
    }

    @Override
    public SocketIOServer setBinaryEvent(SocketIOServer socketIOServer) {
        return socketIOServer;
    }

    @Override
    public SocketIOServer setNamespaceEvent(SocketIONamespace socketIONamespace, SocketIOServer socketIOServer) {
        socketIONamespace.addEventListener(WebsocketConstants.JOIN_ROOM, Map.class, new DataListener<Map>() {
            @Override
            public void onData(SocketIOClient client, Map data, AckRequest ackRequest) {
                String username = ParseHeaderUtil.parseUserNameFromHeader(client.getHandshakeData());
                String projectId = ParseHeaderUtil.parseProjectIdFromHeader(client.getHandshakeData());
                if (StrUtil.isBlank(username) || StrUtil.isBlank(projectId)) {
                    client.sendEvent(WebsocketConstants.EVENT_ERROR, "请求参数非法");
                    throw new SocketIOException("请求参数非法");
                }
                client.set(ATTR_USERNAME, username);
                client.set(ATTR_PROJECT, projectId);
                Set<String> onlineUsers = initOnlineUserSet(client, projectId);
                client.joinRoom(projectId);
                onlineUsers.add(username);
                Object[] roster = onlineUsers.toArray();
                client.getNamespace().getRoomOperations(projectId).sendEvent(
                        WebsocketConstants.JOIN_ROOM, new JoinLeaveRoomVo(username, roster));
                log.info("用户{}加入协作, online={}", username, roster.length);
            }
        });

        socketIONamespace.addEventListener(WebsocketConstants.LEAVE_ROOM, Map.class, new DataListener<Map>() {
            @Override
            public void onData(SocketIOClient client, Map data, AckRequest ackRequest) {
                leavePresence(client, false);
            }
        });

        // 关页/断网：与显式 leave 同路径清名单（多标签同用户仅最后一连接离开才摘名）
        socketIONamespace.addDisconnectListener(new DisconnectListener() {
            @Override
            public void onDisconnect(SocketIOClient client) {
                leavePresence(client, true);
            }
        });
        return socketIOServer;
    }

    private void leavePresence(SocketIOClient client, boolean fromDisconnect) {
        String username = client.get(ATTR_USERNAME);
        String projectId = client.get(ATTR_PROJECT);
        if (StrUtil.isBlank(username)) {
            username = ParseHeaderUtil.parseUserNameFromHeader(client.getHandshakeData());
        }
        if (StrUtil.isBlank(projectId)) {
            projectId = ParseHeaderUtil.parseProjectIdFromHeader(client.getHandshakeData());
        }
        if (StrUtil.isBlank(username) || StrUtil.isBlank(projectId)) {
            log.debug("leavePresence skip: missing identity (disconnect={})", fromDisconnect);
            return;
        }
        UUID selfId = client.getSessionId();
        client.leaveRoom(projectId);

        boolean stillInRoom = false;
        for (SocketIOClient peer : client.getNamespace().getRoomOperations(projectId).getClients()) {
            if (selfId.equals(peer.getSessionId())) {
                continue;
            }
            String peerUser = peer.get(ATTR_USERNAME);
            if (StrUtil.isBlank(peerUser)) {
                peerUser = ParseHeaderUtil.parseUserNameFromHeader(peer.getHandshakeData());
            }
            if (username.equals(peerUser)) {
                stillInRoom = true;
                break;
            }
        }
        if (stillInRoom) {
            log.info("用户{}仍有其它连接在房间{}, 不断名单", username, projectId);
            return;
        }

        Set<String> onlineUsers = initOnlineUserSet(client, projectId);
        onlineUsers.remove(username);
        Object[] roster = onlineUsers.toArray();
        client.getNamespace().getRoomOperations(projectId).sendEvent(
                WebsocketConstants.LEAVE_ROOM, new JoinLeaveRoomVo(username, roster));
        log.info("用户{}离开协作(disconnect={}), online={}", username, fromDisconnect, roster.length);
    }

    private Set<String> initOnlineUserSet(SocketIOClient client, String projectId) {
        RedissonClient redisson = (RedissonClient) SpringContextHelper.getBean(WebsocketConstants.REDISSON_SPRING_BEAN_NAME);
        return redisson.getSortedSet(getRoomKey(client, projectId));
    }

    private String getRoomKey(SocketIOClient client, String projectId) {
        return WebsocketConstants.SOCKET_IO_CACHE_PREFIX
                + client.getNamespace().getName().replace(StrUtil.SLASH, StrUtil.COLON)
                + StrUtil.COLON + projectId;
    }

    @Override
    public String getNamespace() {
        return MODULE;
    }
}
