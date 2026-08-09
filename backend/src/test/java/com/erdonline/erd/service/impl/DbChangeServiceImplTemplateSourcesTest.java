package com.erdonline.erd.service.impl;

import com.erdonline.common.core.api.R;
import com.erdonline.erd.util.DdlTemplateKeys;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DbChangeServiceImplTemplateSourcesTest {

    private final DbChangeServiceImpl service = new DbChangeServiceImpl();

    @Test
    void listDdlTemplateSources_mysqlReturnsClasspathSeed() {
        R result = service.listDdlTemplateSources(Map.of("dialectCode", "MYSQL"));

        assertEquals(200, result.getCode());
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) result.getData();
        @SuppressWarnings("unchecked")
        Map<String, String> sources = (Map<String, String>) data.get("sources");
        assertEquals(11, sources.size());
        assertTrue(sources.get(DdlTemplateKeys.CREATE_TABLE).contains("CREATE TABLE"));
    }

    @Test
    void listDdlTemplateSources_sqlServerReturnsClasspathSeed() {
        R result = service.listDdlTemplateSources(Map.of("dialectCode", "SQLServer"));

        assertEquals(200, result.getCode());
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) result.getData();
        @SuppressWarnings("unchecked")
        Map<String, String> sources = (Map<String, String>) data.get("sources");
        assertEquals(11, sources.size());
        assertTrue(sources.get(DdlTemplateKeys.CREATE_TABLE).contains("IDENTITY"));
    }

    @Test
    void listDdlTemplateSources_rejectsBlankDialectCode() {
        R result = service.listDdlTemplateSources(Map.of("dialectCode", "  "));

        assertTrue(result.getCode() != 200);
        assertFalse(String.valueOf(result.getMsg()).isBlank());
    }
}
