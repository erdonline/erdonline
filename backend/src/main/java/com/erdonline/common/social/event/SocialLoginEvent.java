package com.erdonline.common.social.event;

import com.erdonline.common.bean.system.Log;
import com.erdonline.common.bean.system.User;
import org.springframework.context.ApplicationEvent;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/8/6
 * @describtion LoginEvent
 * @since 1.0
 */
public class SocialLoginEvent extends ApplicationEvent {
    public SocialLoginEvent(User source) {
        super(source);
    }
}
