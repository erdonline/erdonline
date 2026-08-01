package com.erdonline.erd.service.impl;

import com.erdonline.erd.entity.Project;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;

class ProjectEnsureDefaultJsonTest {

    @Test
    void nullProjectJson_getsEmptyModules() {
        Project p = new Project();
        ProjectServiceImpl.ensureDefaultProjectJson(p);
        assertNotNull(p.getProjectJSON());
        assertInstanceOf(List.class, p.getProjectJSON().get("modules"));
        assertEquals(0, ((List<?>) p.getProjectJSON().get("modules")).size());
    }

    @Test
    void missingModules_filled() {
        Project p = new Project();
        Map<String, Object> json = new HashMap<>();
        json.put("profile", Map.of());
        p.setProjectJSON(json);
        ProjectServiceImpl.ensureDefaultProjectJson(p);
        assertInstanceOf(List.class, p.getProjectJSON().get("modules"));
    }

    @Test
    void existingModules_preserved() {
        Project p = new Project();
        Map<String, Object> json = new HashMap<>();
        List<Object> modules = new ArrayList<>();
        modules.add(Map.of("name", "M1"));
        json.put("modules", modules);
        p.setProjectJSON(json);
        ProjectServiceImpl.ensureDefaultProjectJson(p);
        assertSame(modules, p.getProjectJSON().get("modules"));
        assertEquals(1, ((List<?>) p.getProjectJSON().get("modules")).size());
    }
}
