package com.erdonline.common.social.oauth2.userinfo;

import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;

import java.util.ArrayList;
import java.util.List;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/8/5
 * @describtion WechatMappingJackson2HttpMessageConverter
 * @since 1.0
 */
public class WechatMappingJackson2HttpMessageConverter extends MappingJackson2HttpMessageConverter {
    public WechatMappingJackson2HttpMessageConverter() {
        List<MediaType> mediaTypes = new ArrayList<>();
        mediaTypes.add(MediaType.TEXT_PLAIN);
        mediaTypes.add(MediaType.TEXT_HTML);
        setSupportedMediaTypes(mediaTypes);
    }
}
