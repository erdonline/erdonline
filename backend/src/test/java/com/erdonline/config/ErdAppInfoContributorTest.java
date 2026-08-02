package com.erdonline.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.actuate.info.Info;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ErdAppInfoContributorTest {

    @Test
    void contributeExposesAppNameAndVersion() {
        ErdAppInfoContributor contributor = new ErdAppInfoContributor();
        Info.Builder builder = new Info.Builder();
        contributor.contribute(builder);
        Info info = builder.build();

        @SuppressWarnings("unchecked")
        Map<String, Object> app = (Map<String, Object>) info.getDetails().get("app");
        assertNotNull(app);
        assertEquals(ErdAppInfoContributor.APP_NAME, app.get("name"));
        assertNotNull(app.get("version"));
        assertTrue(app.get("version").toString().length() > 0);
    }

    @Test
    void resolveVersionFallsBackToDevWhenManifestMissing() {
        // 单测 classpath 通常无 Implementation-Version
        assertEquals("dev", ErdAppInfoContributor.resolveVersion());
    }
}
