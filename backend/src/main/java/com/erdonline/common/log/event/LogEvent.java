package com.erdonline.common.log.event;

import com.erdonline.common.bean.system.Log;
import org.springframework.context.ApplicationEvent;

/**
 * @author 狮少
 * @version 1.0
 * @date 2020/9/18
 * @describtion LogEvent
 * @since 1.0
 */
public class LogEvent extends ApplicationEvent {
    public LogEvent(Log source) {
        super(source);
    }
}
