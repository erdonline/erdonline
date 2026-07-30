package com.erdonline.common.social.oauth2.convert;

import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpOutputMessage;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.core.endpoint.OAuth2AccessTokenResponse;
import org.springframework.security.oauth2.core.endpoint.OAuth2ParameterNames;
import org.springframework.security.oauth2.core.http.converter.OAuth2AccessTokenResponseHttpMessageConverter;
import org.springframework.util.StreamUtils;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/8/4
 * @describtion QqOAuth2AccessTokenResponseHttpMessageConverter
 * @since 1.0
 */
@Slf4j
public class QqOAuth2AccessTokenResponseHttpMessageConverter extends OAuth2AccessTokenResponseHttpMessageConverter {

    public QqOAuth2AccessTokenResponseHttpMessageConverter(MediaType... mediaType) {
        setSupportedMediaTypes(Arrays.asList(mediaType));
        this.tokenResponseConverter = new SocialOAuth2AccessTokenResponseConverter();

    }

    @SneakyThrows
    @Override
    protected OAuth2AccessTokenResponse readInternal(Class<? extends OAuth2AccessTokenResponse> clazz, HttpInputMessage inputMessage) {

        String response = StreamUtils.copyToString(inputMessage.getBody(), StandardCharsets.UTF_8);

        log.info("qq的AccessToken响应信息：{}", response);

        // 解析响应信息类似access_token=YOUR_ACCESS_TOKEN&expires_in=3600这样的字符串
        Map<String, String> tokenResponseParameters = Arrays.stream(response.split("&")).collect(Collectors.toMap(s -> s.split("=")[0], s -> s.split("=")[1]));

        // 手动给qq的access_token响应信息添加token_type字段，spring-security会按照oauth2规范校验返回参数
        tokenResponseParameters.put(OAuth2ParameterNames.TOKEN_TYPE, "bearer");
        return this.tokenResponseConverter.convert(tokenResponseParameters);
    }

    @Override
    protected void writeInternal(OAuth2AccessTokenResponse tokenResponse, HttpOutputMessage outputMessage) {
        throw new UnsupportedOperationException();
    }
}
