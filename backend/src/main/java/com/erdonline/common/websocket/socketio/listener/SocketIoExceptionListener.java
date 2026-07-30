package com.erdonline.common.websocket.socketio.listener;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.listener.ExceptionListener;
import com.erdonline.common.core.constant.WebsocketConstants;
import io.netty.channel.ChannelHandlerContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/7/23
 * @describtion SocketIoExceptionListener
 * @since 1.0
 */
@Component
@Slf4j
public class SocketIoExceptionListener implements ExceptionListener {
    @Override
    public void onEventException(Exception e, List<Object> list, SocketIOClient socketIOClient) {
        log.error("onEventException:{}", e);
        sendErrorEvent(e, socketIOClient);
    }

    @Override
    public void onDisconnectException(Exception e, SocketIOClient socketIOClient) {
        log.error("onDisconnectException:{}", e);
        sendErrorEvent(e, socketIOClient);
    }

    @Override
    public void onConnectException(Exception e, SocketIOClient socketIOClient) {
        log.error("onConnectException:{}", e);
        sendErrorEvent(e, socketIOClient);
    }

    @Override
    public void onPingException(Exception e, SocketIOClient socketIOClient) {
        log.error("onPingException:{}", e);
        sendErrorEvent(e, socketIOClient);
    }


    @Override
    public boolean exceptionCaught(ChannelHandlerContext channelHandlerContext, Throwable throwable) throws Exception {
        log.error("onPingException:{}", throwable);
        return false;
    }


    /**
     * 谁发生的错误，就发送给谁
     *
     * @param e
     * @param socketIOClient
     */
    private void sendErrorEvent(Exception e, SocketIOClient socketIOClient) {
        log.error("", e);
        socketIOClient.sendEvent(WebsocketConstants.EVENT_ERROR, "服务发生错误，请联系管理员");
    }
}
