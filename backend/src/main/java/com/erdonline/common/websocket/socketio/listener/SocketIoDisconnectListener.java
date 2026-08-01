package com.erdonline.common.websocket.socketio.listener;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.listener.DisconnectListener;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;

@Slf4j
public class SocketIoDisconnectListener implements DisconnectListener {
    @Autowired
    private RedissonClient redisson;

    @Override
    public void onDisconnect(SocketIOClient client) {
        log.info("DisconnectListener.onDisconnect");
    }
}
