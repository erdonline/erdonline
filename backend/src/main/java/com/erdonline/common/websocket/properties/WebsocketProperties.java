package com.erdonline.common.websocket.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/7/15
 * @describtion WebsocketProperties
 * @since 1.0
 */
@Data
@ConfigurationProperties("martin.websocket")
public class WebsocketProperties {
    private boolean enabled;
    private String[] enableSimpleBroker;
    private String[] applicationDestinationPrefixes;
    private String[] endpoint;
    private String[] allowedOrigins;

}
