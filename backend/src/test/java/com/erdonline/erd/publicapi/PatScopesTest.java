package com.erdonline.erd.publicapi;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PatScopesTest {

    @Test
    void defaultWhenEmpty() {
        assertEquals(PatScopes.DEFAULT_READ, PatScopes.normalizeForMint(List.of()));
        assertEquals(PatScopes.DEFAULT_READ, PatScopes.normalizeForMint(null));
    }

    @Test
    void rejectsUnknownAndWrite() {
        assertThrows(IllegalArgumentException.class,
                () -> PatScopes.normalizeForMint(List.of("admin:all")));
        assertThrows(IllegalArgumentException.class,
                () -> PatScopes.normalizeForMint(List.of(PatScopes.PROJECTS_WRITE)));
    }

    @Test
    void parseAndCsvRoundTrip() {
        Set<String> scopes = PatScopes.parse("versions:read, projects:read");
        assertTrue(scopes.contains(PatScopes.PROJECTS_READ));
        assertEquals("projects:read,versions:read", PatScopes.toCsv(scopes));
    }

    @Test
    void hasHelper() {
        assertTrue(PatScopes.has(Set.of(PatScopes.PROJECTS_READ), PatScopes.PROJECTS_READ));
        assertFalse(PatScopes.has(Set.of(), PatScopes.VERSIONS_READ));
    }

    @Test
    void requireThrowsForbiddenWhenMissing() {
        assertThrows(com.erdonline.common.core.exception.ValidateException.class,
                () -> PatScopes.require(Set.of(PatScopes.VERSIONS_READ), PatScopes.PROJECTS_READ));
        PatScopes.require(Set.of(PatScopes.PROJECTS_READ), PatScopes.PROJECTS_READ);
    }
}
