package com.erdonline.common.social.oauth2.convert;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
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
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/8/4
 * @describtion WechatOAuth2AccessTokenResponseHttpMessageConverter
 * @since 1.0
 */
@Slf4j
public class WechatOAuth2AccessTokenResponseHttpMessageConverter extends OAuth2AccessTokenResponseHttpMessageConverter {

    public WechatOAuth2AccessTokenResponseHttpMessageConverter(MediaType... mediaType) {
        setSupportedMediaTypes(Arrays.asList(mediaType));
        this.tokenResponseConverter = new SocialOAuth2AccessTokenResponseConverter();
    }

    @SneakyThrows
    @Override
    protected OAuth2AccessTokenResponse readInternal(Class<? extends OAuth2AccessTokenResponse> clazz, HttpInputMessage inputMessage) {
        String response = StreamUtils.copyToString(inputMessage.getBody(), StandardCharsets.UTF_8);
        log.info("wechat的AccessToken响应信息：{}", response);
        JSONObject jsonObject = new JSONObject(response);
        Map<String, Object> map = new HashMap<>();
        BeanUtil.copyProperties(jsonObject, map);
        Map<String, String> stringMap = map.entrySet().stream()
                .filter(m -> m.getKey() != null && m.getValue() != null)
                .collect(Collectors.toMap(Map.Entry::getKey, e -> StrUtil.toString(e.getValue())));
        // 手动给wechat的access_token响应信息添加token_type字段，spring-security会按照oauth2规范校验返回参数
        stringMap.put(OAuth2ParameterNames.TOKEN_TYPE, "bearer");
        return this.tokenResponseConverter.convert(stringMap);
    }

    @Override
    protected void writeInternal(OAuth2AccessTokenResponse tokenResponse, HttpOutputMessage outputMessage) {
        throw new UnsupportedOperationException();
    }
}
