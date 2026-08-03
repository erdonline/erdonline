package com.erdonline.erd.security;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertFalse;

/**
 * R-DATA-03：硬编码 Gitlab 账密的死控制器整路径已删除。
 */
class GitlabDeadPathRemovedTest {

    @Test
    void gitlabControllerAndServiceSourcesAreGone() {
        Path root = Path.of("src/main/java/com/erdonline/erd");
        assertFalse(Files.exists(root.resolve("controller/GitlabController.java")));
        assertFalse(Files.exists(root.resolve("service/GitlabService.java")));
        assertFalse(Files.exists(root.resolve("service/impl/GitlabServiceImpl.java")));
        assertFalse(Files.exists(root.resolve("vo/GitlabOauthVo.java")));
    }
}
