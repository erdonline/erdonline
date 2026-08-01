package com.erdonline.common.data.mybatis.config;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * projectJSON TypeHandler：Jackson Map 读写。
 */
class ErdJsonTypeHandlerTest {

    private final ErdJsonTypeHandler handler = new ErdJsonTypeHandler(Map.class);

    @Test
    void roundTripPreservesKeys() {
        Map<String, Object> src = new LinkedHashMap<>();
        src.put("modules", java.util.List.of());
        src.put("projectName", "demo");

        String json = handler.toJson(src);
        Map<String, Object> back = handler.parse(json);

        assertEquals("demo", back.get("projectName"));
        assertTrue(back.containsKey("modules"));
    }
}
