package com.erdonline.common.websocket.socketio.listener;

import cn.hutool.core.util.StrUtil;
import com.corundumstudio.socketio.AckRequest;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.listener.DataListener;
import com.erdonline.common.core.constant.WebsocketConstants;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/7/22
 * @describtion SocketIoDataListener
 * @since 1.0
 */
@Component
@Slf4j
public class SocketIoDataListener implements DataListener<Map> {
    @Override
    public void onData(SocketIOClient client, Map data, AckRequest ackRequest) throws Exception {
        log.info("DataListener.onData");
        checkData(client, data);
    }

    private void checkData(SocketIOClient client, Map data) {
        String projectId = (String) data.get(WebsocketConstants.PROJECT_ID);
        String namespace = client.getNamespace().getName();
        //项目相关的event，需要校验是否带着projectId
        if (StrUtil.containsAny(namespace, WebsocketConstants.PROJECT_NAMESPACE) && StrUtil.isBlank(projectId)) {
            log.error("projectId不能为空");
            client.sendEvent(WebsocketConstants.EVENT_ERROR, WebsocketConstants.PROJECT_ID + WebsocketConstants.INVALID_PARAM);
        }
    }
}
