package com.erdonline.erd.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.Map;

/**
 * 统一 Jackson 工具；业务侧禁止再引入 fastjson。
 */
public final class JsonUtil {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<Map<String, Object>>() {
    };

    private JsonUtil() {
    }

    /**
     * 序列化为 JSON 字符串；失败抛 IllegalStateException。
     */
    public static String generate(Object object) {
        try {
            return MAPPER.writeValueAsString(object);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("JSON serialize failed", e);
        }
    }

    /**
     * 反序列化为指定类型。
     */
    public static <T> T parse(String content, Class<T> valueType) throws IOException {
        return MAPPER.readValue(content, valueType);
    }

    /**
     * 反序列化为 Map。
     */
    public static Map<String, Object> parseMap(String content) {
        try {
            return MAPPER.readValue(content, MAP_TYPE);
        } catch (IOException e) {
            throw new IllegalStateException("JSON parse map failed", e);
        }
    }
}
