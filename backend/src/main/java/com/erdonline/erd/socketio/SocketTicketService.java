package com.erdonline.erd.socketio;

import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import lombok.RequiredArgsConstructor;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

/**
 * Socket.IO 短票：避免把超长 JWT 塞进 handshake query（会触发 400/断连）。
 */
@Service
@RequiredArgsConstructor
public class SocketTicketService {
    public static final String REDIS_PREFIX = "erd:socket:ticket:";
    public static final Duration TTL = Duration.ofMinutes(2);

    private final RedissonClient redisson;

    public String issue(String username) {
        if (StrUtil.isBlank(username)) {
            throw new IllegalArgumentException("username blank");
        }
        String ticket = IdUtil.fastSimpleUUID();
        RBucket<String> bucket = redisson.getBucket(REDIS_PREFIX + ticket);
        bucket.set(username.trim(), TTL);
        return ticket;
    }

    public Optional<String> resolveUsername(String ticket) {
        if (StrUtil.isBlank(ticket)) {
            return Optional.empty();
        }
        String username = redisson.<String>getBucket(REDIS_PREFIX + ticket).get();
        return StrUtil.isBlank(username) ? Optional.empty() : Optional.of(username);
    }
}
