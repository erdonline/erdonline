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
import com.erdonline.erd.security.ProjectAcl;
import com.erdonline.erd.socketio.ErdSocketIoService;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 项目协作 SocketIO：进房/离房/断线清名单（ADR-0009）。
 * 进房前校验 {@code project_user}（R-AUTH-05）；cursor/sync 仅已入房会话可广播。
 */
@Slf4j
@Service
@RestController
public class ErdSocketIoServiceImpl implements ErdSocketIoService {
    private final String MODULE = WebsocketConstants.PROJECT_NAMESPACE + "/erd";

    private static final String ATTR_USERNAME = "erd.presence.username";
    private static final String ATTR_PROJECT = "erd.presence.projectId";
    private static final String ATTR_JOINED = "erd.presence.joined";

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
                String userId = ParseHeaderUtil.parseUserIdFromHeader(client.getHandshakeData());
                if (StrUtil.isBlank(username) || StrUtil.isBlank(projectId) || StrUtil.isBlank(userId)) {
                    client.sendEvent(WebsocketConstants.EVENT_ERROR, "请求参数非法");
                    throw new SocketIOException("请求参数非法");
                }
                // SPI ServiceLoader 实例无 Spring 注入；与 Redisson 一样走 SpringContextHelper
                ProjectAcl acl = SpringContextHelper.getBean(ProjectAcl.class);
                if (!acl.isMember(projectId, userId)) {
                    client.sendEvent(WebsocketConstants.EVENT_ERROR, "无权加入该项目协作");
                    throw new SocketIOException("无权加入该项目协作");
                }
                client.set(ATTR_USERNAME, username);
                client.set(ATTR_PROJECT, projectId);
                client.set(ATTR_JOINED, Boolean.TRUE);
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

        // 协作光标：广播 flow 坐标到同房间其他连接（不含自己）；须已成功 JOIN_ROOM
        socketIONamespace.addEventListener(WebsocketConstants.CURSOR, Map.class, new DataListener<Map>() {
            @Override
            public void onData(SocketIOClient client, Map data, AckRequest ackRequest) {
                if (!Boolean.TRUE.equals(client.get(ATTR_JOINED))) {
                    return;
                }
                String username = client.get(ATTR_USERNAME);
                String projectId = client.get(ATTR_PROJECT);
                if (StrUtil.isBlank(username) || StrUtil.isBlank(projectId) || data == null) {
                    return;
                }
                Object x = data.get("x");
                Object y = data.get("y");
                if (x == null || y == null) {
                    return;
                }
                Map<String, Object> payload = new HashMap<>(4);
                payload.put("username", username);
                payload.put("x", x);
                payload.put("y", y);
                broadcastToPeers(client, projectId, WebsocketConstants.CURSOR, payload);
            }
        });

        // 模型增量：广播 projectJSON 的 jsondiffpatch delta；须已成功 JOIN_ROOM
        socketIONamespace.addEventListener(WebsocketConstants.SYNC, Map.class, new DataListener<Map>() {
            @Override
            public void onData(SocketIOClient client, Map data, AckRequest ackRequest) {
                if (!Boolean.TRUE.equals(client.get(ATTR_JOINED))) {
                    return;
                }
                String username = client.get(ATTR_USERNAME);
                String projectId = client.get(ATTR_PROJECT);
                if (StrUtil.isBlank(username) || StrUtil.isBlank(projectId) || data == null) {
                    return;
                }
                Object delta = data.get("delta");
                if (delta == null) {
                    return;
                }
                Map<String, Object> payload = new HashMap<>(4);
                payload.put("username", username);
                payload.put("timestamp", data.get("timestamp") != null ? data.get("timestamp") : System.currentTimeMillis());
                payload.put("delta", delta);
                broadcastToPeers(client, projectId, WebsocketConstants.SYNC, payload);
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

    private void broadcastToPeers(SocketIOClient client, String projectId, String event, Object payload) {
        UUID selfId = client.getSessionId();
        for (SocketIOClient peer : client.getNamespace().getRoomOperations(projectId).getClients()) {
            if (selfId.equals(peer.getSessionId())) {
                continue;
            }
            peer.sendEvent(event, payload);
        }
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
