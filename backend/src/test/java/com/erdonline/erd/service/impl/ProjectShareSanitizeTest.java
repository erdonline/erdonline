package com.erdonline.erd.service.impl;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * ADR-0008：分享响应清空 profile.dbs，不污染原 Map。
 */
class ProjectShareSanitizeTest {

    @Test
    void sanitizeProjectJson_clearsDbs_withoutMutatingSource() {
        Map<String, Object> props = new HashMap<>();
        props.put("url", "jdbc:mysql://localhost/erd");
        props.put("username", "root");
        props.put("password", "secret");

        Map<String, Object> db = new HashMap<>();
        db.put("name", "local");
        db.put("properties", props);

        Map<String, Object> profile = new HashMap<>();
        profile.put("dbs", List.of(db));
        profile.put("defaultDataSourceId", "ds-1");

        Map<String, Object> projectJson = new HashMap<>();
        projectJson.put("profile", profile);

        Map<String, Object> sanitized = ProjectShareServiceImpl.sanitizeProjectJson(projectJson);
        assertNotSame(projectJson, sanitized);

        @SuppressWarnings("unchecked")
        List<?> outDbs = (List<?>) ((Map<?, ?>) sanitized.get("profile")).get("dbs");
        assertTrue(outDbs == null || outDbs.isEmpty());
        assertEquals("ds-1", ((Map<?, ?>) sanitized.get("profile")).get("defaultDataSourceId"));
        assertEquals(1, ((List<?>) profile.get("dbs")).size());
        assertEquals("secret", props.get("password"));
    }
}
