package com.erdonline.common.security.properties;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/5/22 11:09
 * @describtion PermitAllUrlProperties
 * 模块对外开放的url集合
 * @since 1.0
 */
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
@ConfigurationProperties(prefix = "security.oauth2.client")
@Component
public class PermitAllUrlProperties {
    private List<String> ignoreUrls = new ArrayList<>();

}
