package com.erdonline.erd.util;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class VersionDbKeyResolverTest {

    @Test
    void resolvesLegacySnapshot() {
        assertEquals(
                VersionDbKeyResolver.SNAPSHOT_KEY,
                VersionDbKeyResolver.resolve("SNAPSHOT", null));
    }

    @Test
    void resolvesLegacyDefaultDb() {
        assertEquals(
                "ds-real-id",
                VersionDbKeyResolver.resolve("defaultDB", "ds-real-id"));
    }

    @Test
    void keepsCanonicalKeys() {
        assertEquals("ds-real-id", VersionDbKeyResolver.resolve("ds-real-id", "other"));
        assertEquals(
                VersionDbKeyResolver.SNAPSHOT_KEY,
                VersionDbKeyResolver.resolve(VersionDbKeyResolver.SNAPSHOT_KEY, null));
    }

    @Test
    void readsDefaultDataSourceIdFromProfile() {
        assertEquals(
                "abc",
                VersionDbKeyResolver.defaultDataSourceIdFromProjectJson(
                        Map.of("profile", Map.of("defaultDataSourceId", "abc"))));
        assertNull(VersionDbKeyResolver.defaultDataSourceIdFromProjectJson(Map.of()));
    }
}
