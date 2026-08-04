package com.erdonline.erd.publicapi;

import org.redisson.api.RRateLimiter;
import org.redisson.api.RateIntervalUnit;
import org.redisson.api.RateType;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Redis（Redisson {@link RRateLimiter}）集群限流，按 PAT / IP 共享配额（ADR-0013）。
 * Redis 不可用时 <strong>fail-closed</strong>（拒绝请求），避免多实例旁路。
 */
public class PublicApiRateLimiter {

    public enum Decision {
        /** under quota */
        ALLOW,
        /** over quota */
        DENY,
        /** Redis error; fail-closed */
        UNAVAILABLE
    }

    static final String KEY_PREFIX = "erd:public-api:rl:";

    private static final Logger log = LoggerFactory.getLogger(PublicApiRateLimiter.class);

    private final RedissonClient redisson;
    private final int limitPerMinute;

    public PublicApiRateLimiter(RedissonClient redisson, int limitPerMinute) {
        if (redisson == null) {
            throw new IllegalArgumentException("redisson must not be null");
        }
        if (limitPerMinute < 1) {
            throw new IllegalArgumentException("limitPerMinute must be >= 1");
        }
        this.redisson = redisson;
        this.limitPerMinute = limitPerMinute;
    }

    public int getLimitPerMinute() {
        return limitPerMinute;
    }

    /**
     * @param key stable bucket id, e.g. {@code pat:<id>} or {@code ip:<addr>}
     */
    public Decision tryAcquire(String key) {
        if (key == null || key.isBlank()) {
            key = "anonymous";
        }
        try {
            RRateLimiter limiter = redisson.getRateLimiter(KEY_PREFIX + key);
            // only seeds when key is new; existing buckets keep prior rate until Redis TTL/evict
            limiter.trySetRate(RateType.OVERALL, limitPerMinute, 1, RateIntervalUnit.MINUTES);
            return limiter.tryAcquire(1) ? Decision.ALLOW : Decision.DENY;
        } catch (RuntimeException ex) {
            log.warn("public API rate limit Redis unavailable (fail-closed) key={}", key, ex);
            return Decision.UNAVAILABLE;
        }
    }
}
