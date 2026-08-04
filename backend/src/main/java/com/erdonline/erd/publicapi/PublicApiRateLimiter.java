package com.erdonline.erd.publicapi;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 进程内滑动窗口限流骨架（ADR-0013）。单机足够；集群后续可换 Redis。
 */
public class PublicApiRateLimiter {

    private final int limitPerMinute;
    private final Map<String, Deque<Long>> windows = new ConcurrentHashMap<>();

    public PublicApiRateLimiter(int limitPerMinute) {
        if (limitPerMinute < 1) {
            throw new IllegalArgumentException("limitPerMinute must be >= 1");
        }
        this.limitPerMinute = limitPerMinute;
    }

    public int getLimitPerMinute() {
        return limitPerMinute;
    }

    /**
     * @return true if the call is allowed; false if over quota
     */
    public boolean tryAcquire(String key, long nowMillis) {
        if (key == null || key.isBlank()) {
            key = "anonymous";
        }
        long windowStart = nowMillis - 60_000L;
        Deque<Long> q = windows.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (q) {
            while (!q.isEmpty() && q.peekFirst() < windowStart) {
                q.pollFirst();
            }
            if (q.size() >= limitPerMinute) {
                return false;
            }
            q.addLast(nowMillis);
            return true;
        }
    }

    /** Test / admin: clear state. */
    void clear() {
        windows.clear();
    }
}
