package com.erdonline.erd.event;

import com.erdonline.erd.entity.QueryHistory;
import org.springframework.context.ApplicationEvent;

/**
 * @author 狮少
 * @version 1.0
 * @date 2020/9/18
 * @describtion LogEvent
 * @since 1.0
 */
public class QueryHistoryEvent extends ApplicationEvent {
    public QueryHistoryEvent(QueryHistory source) {
        super(source);
    }
}
