package com.erdonline.erd.catalog;

import com.erdonline.erd.service.impl.ProjectShareServiceImpl;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CatalogServiceImplTest {

    @Test
    void prepareInstallJson_stripsDbsAndDefaultDataSource() {
        Map<String, Object> profile = new HashMap<>();
        profile.put("defaultDataSourceId", "ds-1");
        profile.put("dbs", List.of(Map.of("name", "secret")));
        Map<String, Object> json = new HashMap<>();
        json.put("profile", profile);
        json.put("modules", List.of());

        Map<String, Object> out = invokePrepare(json);
        @SuppressWarnings("unchecked")
        Map<String, Object> outProfile = (Map<String, Object>) out.get("profile");
        assertNotNull(outProfile);
        assertTrue(outProfile.get("dbs") instanceof List);
        assertTrue(((List<?>) outProfile.get("dbs")).isEmpty());
        assertTrue(!outProfile.containsKey("defaultDataSourceId"));
    }

    @Test
    void sanitizeViaShare_isUsed() {
        Map<String, Object> json = new HashMap<>();
        Map<String, Object> profile = new HashMap<>();
        profile.put("dbs", List.of(Map.of("password", "x")));
        json.put("profile", profile);
        Map<String, Object> sanitized = ProjectShareServiceImpl.sanitizeProjectJson(json);
        @SuppressWarnings("unchecked")
        List<?> dbs = (List<?>) ((Map<?, ?>) sanitized.get("profile")).get("dbs");
        assertTrue(dbs.isEmpty());
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> invokePrepare(Map<String, Object> source) {
        try {
            var m = CatalogServiceImpl.class.getDeclaredMethod("prepareInstallJson", Map.class);
            m.setAccessible(true);
            return (Map<String, Object>) m.invoke(null, source);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
