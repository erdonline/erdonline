package com.erdonline.erd.util;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Jackson JsonUtil 回归：替代 fastjson 后的序列化契约。
 */
class JsonUtilTest {

    @Test
    void generateAndParseMapRoundTrip() {
        Map<String, Object> src = new LinkedHashMap<>();
        src.put("name", "T_USER");
        src.put("pk", true);

        String json = JsonUtil.generate(src);
        assertTrue(json.contains("\"name\":\"T_USER\""));

        Map<String, Object> back = JsonUtil.parseMap(json);
        assertEquals("T_USER", back.get("name"));
        assertEquals(Boolean.TRUE, back.get("pk"));
    }
}
