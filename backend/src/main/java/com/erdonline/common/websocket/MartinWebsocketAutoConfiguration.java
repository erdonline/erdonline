package com.erdonline.common.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.erdonline.common.websocket.properties.WebsocketProperties;
import com.erdonline.common.websocket.config.CustomHandshakeHandler;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.Redisson;
import org.redisson.api.RLock;
import org.redisson.api.RMap;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.messaging.SessionConnectedEvent;

import java.util.Map;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/5/18
 * @describtion MartinWebsocketAutoConfiguration
 * @since 1.0
 */
@Slf4j
@Configuration
@AllArgsConstructor
@ConditionalOnWebApplication
@EnableConfigurationProperties({WebsocketProperties.class})
@ConditionalOnProperty(
        prefix = "martin.websocket",
        name = {"enabled"},
        havingValue = "true",
        matchIfMissing = true
)
@ComponentScan(basePackages = {"com.erdonline.common.websocket", "com.erdonline.common.core"})
@EnableWebSocketMessageBroker
@EnableAsync(proxyTargetClass = true)
public class MartinWebsocketAutoConfiguration implements WebSocketMessageBrokerConfigurer {
    @Autowired
    private WebsocketProperties websocketProperties;

    @Bean
    public MappingJackson2HttpMessageConverter mappingJackson2HttpMessageConverter() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        MappingJackson2HttpMessageConverter converter =
                new MappingJackson2HttpMessageConverter(mapper);
        return converter;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker(websocketProperties.getEnableSimpleBroker());
        registry.setApplicationDestinationPrefixes(websocketProperties.getApplicationDestinationPrefixes());
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint(websocketProperties.getEndpoint())
                .setHandshakeHandler(new CustomHandshakeHandler())
                .setAllowedOrigins(websocketProperties.getAllowedOrigins())
                .withSockJS();
    }

    @EventListener
    public void handleSessionConnectedEvent(SessionConnectedEvent event) {
        // Get Accessor
        StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
        System.out.println("sha = " + sha);
    }

//	@Override
//	public void configureClientInboundChannel(ChannelRegistration registration) {
//		registration.interceptors(new ChannelInterceptor() {
//			@Override
//			public Message<?> preSend(Message<?> message, MessageChannel channel) {
//				StompHeaderAccessor accessor =
//						MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
//				if (StompCommand.CONNECT.equals(accessor.getCommand())) {
//					Neo4jProperties.Authentication user = ... ; // access authentication header(s)
//					accessor.setUser(user);
//				}
//				return message;
//			}
//		});
//	}

}
