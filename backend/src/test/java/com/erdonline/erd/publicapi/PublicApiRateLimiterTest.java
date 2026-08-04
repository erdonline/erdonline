package com.erdonline.erd.publicapi;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PublicApiRateLimiterTest {

    private PublicApiRateLimiter limiter;

    @BeforeEach
    void setUp() {
        limiter = new PublicApiRateLimiter(3);
    }

    @Test
    void allowsUpToLimitThenBlocks() {
        long t0 = 1_000_000L;
        assertTrue(limiter.tryAcquire("pat:1", t0));
        assertTrue(limiter.tryAcquire("pat:1", t0 + 1));
        assertTrue(limiter.tryAcquire("pat:1", t0 + 2));
        assertFalse(limiter.tryAcquire("pat:1", t0 + 3));
    }

    @Test
    void windowSlides() {
        long t0 = 2_000_000L;
        assertTrue(limiter.tryAcquire("pat:2", t0));
        assertTrue(limiter.tryAcquire("pat:2", t0 + 1));
        assertTrue(limiter.tryAcquire("pat:2", t0 + 2));
        assertFalse(limiter.tryAcquire("pat:2", t0 + 3));
        // oldest falls out of 60s window
        assertTrue(limiter.tryAcquire("pat:2", t0 + 60_001L));
    }

    @Test
    void keysAreIsolated() {
        long t0 = 3_000_000L;
        assertTrue(limiter.tryAcquire("a", t0));
        assertTrue(limiter.tryAcquire("a", t0));
        assertTrue(limiter.tryAcquire("a", t0));
        assertFalse(limiter.tryAcquire("a", t0));
        assertTrue(limiter.tryAcquire("b", t0));
    }

    @Test
    void rejectsNonPositiveLimit() {
        assertThrows(IllegalArgumentException.class, () -> new PublicApiRateLimiter(0));
    }
}
