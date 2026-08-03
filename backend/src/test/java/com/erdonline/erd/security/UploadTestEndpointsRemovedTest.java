package com.erdonline.erd.security;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * R-DATA-04：无归属测试上传接口已从控制器删除。
 */
class UploadTestEndpointsRemovedTest {

    @Test
    void projectAndGroupAndWsControllersHaveNoUploadTest() throws Exception {
        Path root = Path.of("src/main/java/com/erdonline/erd/controller");
        String project = Files.readString(root.resolve("ProjectController.java"));
        String group = Files.readString(root.resolve("GroupProjectController.java"));
        String ws = Files.readString(root.resolve("WsController.java"));
        assertFalse(project.contains("uploadTest") || project.contains("@PostMapping(\"upload\")"));
        assertFalse(group.contains("uploadTest") || group.contains("@PostMapping(\"upload\")"));
        assertFalse(ws.contains("uploadTest") || ws.contains("@PostMapping(\"upload\")"));
        assertTrue(Files.exists(root.resolve("GenDocController.java")));
    }
}
