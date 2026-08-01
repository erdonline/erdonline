package com.erdonline.common.websocket.config;

import com.erdonline.common.security.util.SecurityContextUtil;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/5/21
 * @describtion AuthChannelInterceptorAdapter
 * @since 1.0
 */
@Component("authChannelInterceptorAdapter")
public class AuthChannelInterceptorAdapter implements ChannelInterceptor {
    @Override
    public Message<?> preSend(final Message<?> message, final MessageChannel channel) throws AuthenticationException {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (StompCommand.CONNECT == accessor.getCommand()) {
            Authentication user = SecurityContextUtil.getAuthentication();
            accessor.setUser(user);
        }
        return message;
    }
}
