package com.erdonline.common.websocket.socketio;

import com.corundumstudio.socketio.SocketIONamespace;
import com.corundumstudio.socketio.SocketIOServer;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/7/20
 * @describtion SocketIoOInterface
 * @since 1.0
 */
public interface SocketIoService {
    /**
     * 配置普通事件
     *
     * @param socketIOServer
     * @return
     */
    SocketIOServer setEvent(SocketIOServer socketIOServer);

    /**
     * 配置流事件
     *
     * @param socketIOServer
     * @return
     */
    SocketIOServer setBinaryEvent(SocketIOServer socketIOServer);


    /**
     * 配置命名空间中的事件
     *
     * @param namespace      命名空间
     * @param socketIOServer
     * @return
     */
    SocketIOServer setNamespaceEvent(SocketIONamespace namespace, SocketIOServer socketIOServer);

    /**
     * 获取命名空间
     *
     * @return
     */
    String getNamespace();
}
