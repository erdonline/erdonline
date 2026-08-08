package com.erdonline.erd.service.impl;

import com.erdonline.erd.entity.VersionAttribution;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VersionAttributionServiceImplTest {

    @Test
    void truncate_respectsMaxLength() {
        assertEquals("abc", VersionAttributionServiceImpl.truncate("abc", 128));
        assertEquals(128, VersionAttributionServiceImpl.truncate("x".repeat(200), 128).length());
    }

    @Test
    void isBlankAttribution_requiresAtLeastOneField() {
        VersionAttribution empty = new VersionAttribution();
        assertTrue(VersionAttributionServiceImpl.isBlankAttribution(empty));

        VersionAttribution withUtm = new VersionAttribution().setUtmSource("hn");
        assertFalse(VersionAttributionServiceImpl.isBlankAttribution(withUtm));
    }

    @Test
    void longVal_parsesNumberAndString() {
        assertEquals(42L, VersionAttributionServiceImpl.longVal(42));
        assertEquals(99L, VersionAttributionServiceImpl.longVal("99"));
        assertNull(VersionAttributionServiceImpl.longVal("not-a-number"));
    }
}
