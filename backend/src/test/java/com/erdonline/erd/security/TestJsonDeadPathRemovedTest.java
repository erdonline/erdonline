package com.erdonline.erd.security;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertFalse;

/**
 * R-DATA-05：TestJson 样板 CRUD 整路径已删除（Controller/Service/Mapper/Entity/XML）。
 */
class TestJsonDeadPathRemovedTest {

    @Test
    void testJsonSourcesAndMapperXmlAreGone() {
        Path javaRoot = Path.of("src/main/java/com/erdonline/erd");
        assertFalse(Files.exists(javaRoot.resolve("controller/TestJsonController.java")));
        assertFalse(Files.exists(javaRoot.resolve("service/TestJsonService.java")));
        assertFalse(Files.exists(javaRoot.resolve("service/impl/TestJsonServiceImpl.java")));
        assertFalse(Files.exists(javaRoot.resolve("mapper/TestJsonMapper.java")));
        assertFalse(Files.exists(javaRoot.resolve("entity/TestJson.java")));
        assertFalse(Files.exists(Path.of("src/main/resources/mapper/TestJsonMapper.xml")));
    }
}
