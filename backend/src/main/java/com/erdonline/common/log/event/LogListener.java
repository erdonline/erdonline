package com.erdonline.common.log.event;

import com.erdonline.common.api.system.RemoteSystemLog;
import com.erdonline.common.bean.system.Log;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;

/**
 * @author 狮少
 * @version 1.0
 * @date 2020/9/18
 * @describtion LogListener
 * @since 1.0
 */
@Slf4j
@Component
public class LogListener {
    @Autowired
    private RemoteSystemLog remoteSystemLog;

    @Async
    @Order
    @EventListener(LogEvent.class)
    public void saveLog(LogEvent event) {
        Log log = (Log) event.getSource();
        remoteSystemLog.addSystemLog(log);
    }
}
