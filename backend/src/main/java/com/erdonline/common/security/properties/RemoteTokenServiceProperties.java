package com.erdonline.common.security.properties;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.boot.autoconfigure.security.oauth2.OAuth2ClientProperties;
import org.springframework.boot.autoconfigure.security.oauth2.resource.ResourceServerProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/8/27
 * @describtion RemoteTokenServiceProperties
 * @since 1.0
 */
@Data
@AllArgsConstructor
@Configuration
@ConfigurationProperties(prefix = "security.oauth2")
public class RemoteTokenServiceProperties {
    private final ResourceServerProperties resourceServerProperties;
    private final OAuth2ClientProperties oAuth2ClientProperties;

}
