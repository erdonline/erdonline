package com.erdonline.erd.publicapi;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PatTokenCodecTest {

    @Test
    void generateLooksLikePatAndHashesStable() {
        String a = PatTokenCodec.generatePlaintext();
        String b = PatTokenCodec.generatePlaintext();
        assertTrue(PatTokenCodec.looksLikePat(a));
        assertTrue(a.startsWith(PatTokenCodec.PREFIX));
        assertNotEquals(a, b);
        assertEquals(64, PatTokenCodec.hash(a).length());
        assertEquals(PatTokenCodec.hash(a), PatTokenCodec.hash(a));
        assertNotEquals(PatTokenCodec.hash(a), PatTokenCodec.hash(b));
    }

    @Test
    void plaintextNeverEqualsHash() {
        String plain = PatTokenCodec.generatePlaintext();
        assertFalse(plain.equalsIgnoreCase(PatTokenCodec.hash(plain)));
    }

    @Test
    void hintHidesSecret() {
        String plain = PatTokenCodec.PREFIX + "0123456789abcdef0123456789abcdef01234567";
        String hint = PatTokenCodec.hint(plain);
        assertTrue(hint.contains("…"));
        assertTrue(hint.endsWith("4567"));
        assertFalse(hint.contains("0123456789abcdef"));
        assertTrue(hint.length() <= 12);
    }

    @Test
    void rejectsNonPat() {
        assertFalse(PatTokenCodec.looksLikePat(null));
        assertFalse(PatTokenCodec.looksLikePat("Bearer x"));
        assertFalse(PatTokenCodec.looksLikePat("erd_pat_short"));
    }
}
