package com.erdonline.auth.config;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * R-AUTH-07：Security 链对 X-Frame-Options 使用 DENY（禁止 disable）。
 */
class FrameOptionsContractTest {

    @Test
    void securityFilterChainDeniesFraming() throws IOException {
        String src = Files.readString(Path.of(
                "src/main/java/com/erdonline/auth/config/ErdSecurityConfiguration.java"));
        assertTrue(src.contains("frameOptions(f -> f.deny())"),
                "expected frameOptions DENY");
        assertFalse(src.contains("frameOptions(f -> f.disable())"),
                "frameOptions must not be disabled");
    }
}
