package com.erdonline.common.websocket.socketio.listener;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.handler.SocketIOException;
import com.corundumstudio.socketio.listener.ConnectListener;
import com.erdonline.common.core.constant.WebsocketConstants;
import com.erdonline.common.websocket.properties.SocketIoProperties;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RedissonClient;
import org.redisson.spring.starter.RedissonAutoConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.provider.token.DefaultTokenServices;
import org.springframework.stereotype.Component;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/7/22
 * @describtion SocketIoConnectListener
 * @since 1.0
 */
@Slf4j
@Component
public class SocketIoConnectListener implements ConnectListener {
    @Autowired
    private DefaultTokenServices remoteTokenServices;

    @Autowired
    private SocketIoProperties socketIoProperties;

    /**
     * @see RedissonAutoConfiguration#redisson()
     */
    @Autowired
    private RedissonClient redisson;

    @Override
    public void onConnect(SocketIOClient client) {
        log.info("ConnectListener.onConnect");
        int retryCount = socketIoProperties.getRetryCount();
        Object count = client.get(WebsocketConstants.RETRY_COUNT);
        Integer redisRetryCount = count == null ? 0 : (Integer) count;
        client.set(WebsocketConstants.RETRY_COUNT, redisRetryCount + 1);
        log.info("retryCount:{}", retryCount);
        if (retryCount > 0) {
            //超过重连次数
            log.info("redisRetryCount:{}", redisRetryCount);
            if (redisRetryCount > retryCount) {
                String name = client.getNamespace().getName();
                log.info("name:{}", name);
                client.getNamespace().getClient(client.getSessionId()).sendEvent("disconnect", WebsocketConstants.OVER_RETRY_COUNT);
                client.sendEvent("disconnect", WebsocketConstants.OVER_RETRY_COUNT);
                throw new SocketIOException(WebsocketConstants.OVER_RETRY_COUNT);
            }
        }
        client.set(WebsocketConstants.RETRY_COUNT, 0);

    }
}
