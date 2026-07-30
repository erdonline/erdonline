package com.erdonline.common.websocket.socketio.listener;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.listener.DisconnectListener;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RedissonClient;
import org.redisson.spring.starter.RedissonAutoConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.provider.token.DefaultTokenServices;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/7/22
 * @describtion SocketIoDisConnectListener
 * @since 1.0
 */
@Slf4j
public class SocketIoDisconnectListener implements DisconnectListener {
    @Autowired
    private DefaultTokenServices remoteTokenServices;

    /**
     * @see RedissonAutoConfiguration#redisson()
     */
    @Autowired
    private RedissonClient redisson;

    @Override
    public void onDisconnect(SocketIOClient client) {
        log.info("DisconnectListener.onDisconnect");
//        // 可以使用如下代码获取用户密码信息
//        String token = ParseHeaderUtil.parseTokenFromHeader(client.getHandshakeData());
//        try {
//            if (StrUtil.isBlank(token)) {
//                client.sendEvent(WebsocketConstants.EVENT_ERROR, WebsocketConstants.TOKEN + WebsocketConstants.INVALID_PARAM);
//            }
//            OAuth2Authentication oAuth2Authentication = remoteTokenServices.loadAuthentication(token);
//            MartinUser martinUser = (MartinUser) oAuth2Authentication.getPrincipal();
//            if (ObjectUtil.isNull(martinUser)) {
//                log.info("martinUser为null");
//                client.sendEvent(WebsocketConstants.EVENT_ERROR, ApiErrorCode.INVALID_TOKEN);
//            }
//            String username = martinUser.getUsername();
//            String sessionId = client.getSessionId().toString();
//            log.info("用户离线, username: {},sessionId: {}", username, sessionId);
//            String projectId = client.getHandshakeData().getSingleUrlParam(ProjectConstants.PROJECT_ID);
//            RSortedSet<Object> sortedSet = redisson.getSortedSet(projectId + client.getNamespace().getName());
//            sortedSet.remove(username);
//            redisson.getMap(client.getSessionId().toString()).clear();
//            // broadcast messages to all clients
//            client.getNamespace().getBroadcastOperations().sendEvent(WebsocketConstants.EVENT_ONLINE_USER, sortedSet.readAll());
//        } catch (AuthenticationException e) {
//            log.error("", e);
//            client.sendEvent(WebsocketConstants.EVENT_ERROR, ApiErrorCode.OAUTH_ERROR);
//        } catch (InvalidTokenException e) {
//            log.error("", e);
//            client.sendEvent(WebsocketConstants.EVENT_ERROR, ApiErrorCode.INVALID_TOKEN);
//        }
    }
}
