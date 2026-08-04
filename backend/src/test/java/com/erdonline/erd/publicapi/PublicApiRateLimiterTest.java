package com.erdonline.erd.publicapi;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RRateLimiter;
import org.redisson.api.RateIntervalUnit;
import org.redisson.api.RateType;
import org.redisson.api.RedissonClient;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PublicApiRateLimiterTest {

    @Mock
    private RedissonClient redisson;
    @Mock
    private RRateLimiter rateLimiter;

    private PublicApiRateLimiter limiter;

    @BeforeEach
    void setUp() {
        limiter = new PublicApiRateLimiter(redisson, 60);
        lenient().when(redisson.getRateLimiter(anyString())).thenReturn(rateLimiter);
        lenient().when(rateLimiter.trySetRate(eq(RateType.OVERALL), anyLong(), anyLong(), eq(RateIntervalUnit.MINUTES)))
                .thenReturn(true);
    }

    @Test
    void allowsWhenRedisAcquireSucceeds() {
        when(rateLimiter.tryAcquire(1)).thenReturn(true);
        assertEquals(PublicApiRateLimiter.Decision.ALLOW, limiter.tryAcquire("pat:1"));
        verify(redisson).getRateLimiter(PublicApiRateLimiter.KEY_PREFIX + "pat:1");
        verify(rateLimiter).trySetRate(RateType.OVERALL, 60, 1, RateIntervalUnit.MINUTES);
    }

    @Test
    void deniesWhenOverQuota() {
        when(rateLimiter.tryAcquire(1)).thenReturn(false);
        assertEquals(PublicApiRateLimiter.Decision.DENY, limiter.tryAcquire("pat:1"));
    }

    @Test
    void failClosedWhenRedisThrows() {
        when(redisson.getRateLimiter(anyString())).thenThrow(new RuntimeException("redis down"));
        assertEquals(PublicApiRateLimiter.Decision.UNAVAILABLE, limiter.tryAcquire("pat:1"));
    }

    @Test
    void blankKeyUsesAnonymousBucket() {
        when(rateLimiter.tryAcquire(1)).thenReturn(true);
        assertEquals(PublicApiRateLimiter.Decision.ALLOW, limiter.tryAcquire("  "));
        verify(redisson).getRateLimiter(PublicApiRateLimiter.KEY_PREFIX + "anonymous");
    }

    @Test
    void keysUseDistinctRedisBuckets() {
        when(rateLimiter.tryAcquire(1)).thenReturn(true);
        limiter.tryAcquire("pat:a");
        limiter.tryAcquire("pat:b");
        verify(redisson).getRateLimiter(eq(PublicApiRateLimiter.KEY_PREFIX + "pat:a"));
        verify(redisson).getRateLimiter(eq(PublicApiRateLimiter.KEY_PREFIX + "pat:b"));
    }

    @Test
    void rejectsNonPositiveLimit() {
        assertThrows(IllegalArgumentException.class, () -> new PublicApiRateLimiter(redisson, 0));
    }

    @Test
    void rejectsNullRedisson() {
        assertThrows(IllegalArgumentException.class, () -> new PublicApiRateLimiter(null, 60));
    }
}
