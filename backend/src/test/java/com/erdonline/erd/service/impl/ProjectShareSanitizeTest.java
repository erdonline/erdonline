package com.erdonline.erd.service.impl;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotSame;

/**
 * 分享响应脱敏：dbs 密码/用户名打码且不污染原 Map。
 */
class ProjectShareSanitizeTest {

    @Test
    void sanitizeProjectJson_masksDbSecrets_withoutMutatingSource() {
        Map<String, Object> props = new HashMap<>();
        props.put("url", "jdbc:mysql://localhost/erd");
        props.put("username", "root");
        props.put("password", "secret");

        Map<String, Object> db = new HashMap<>();
        db.put("name", "local");
        db.put("properties", props);

        Map<String, Object> profile = new HashMap<>();
        profile.put("dbs", List.of(db));

        Map<String, Object> projectJson = new HashMap<>();
        projectJson.put("profile", profile);

        Map<String, Object> sanitized = ProjectShareServiceImpl.sanitizeProjectJson(projectJson);
        assertNotSame(projectJson, sanitized);

        @SuppressWarnings("unchecked")
        Map<String, Object> outProps = (Map<String, Object>)
                ((Map<?, ?>) ((List<?>) ((Map<?, ?>) sanitized.get("profile")).get("dbs")).get(0))
                        .get("properties");
        assertEquals("***", outProps.get("password"));
        assertEquals("***", outProps.get("username"));
        assertEquals("jdbc:mysql://localhost/erd", outProps.get("url"));
        assertEquals("secret", props.get("password"));
    }
}
