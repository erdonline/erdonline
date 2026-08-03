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
 * 载荷含 userId，供进房时校验 {@code project_user}（R-AUTH-05）。
 */
@Service
@RequiredArgsConstructor
public class SocketTicketService {
    public static final String REDIS_PREFIX = "erd:socket:ticket:";
    public static final Duration TTL = Duration.ofMinutes(2);

    /** wire format: userId + \\n + username */
    private static final char SEP = '\n';

    private final RedissonClient redisson;

    public String issue(String userId, String username) {
        if (StrUtil.isBlank(userId) || StrUtil.isBlank(username)) {
            throw new IllegalArgumentException("userId/username blank");
        }
        String ticket = IdUtil.fastSimpleUUID();
        RBucket<String> bucket = redisson.getBucket(REDIS_PREFIX + ticket);
        bucket.set(userId.trim() + SEP + username.trim(), TTL);
        return ticket;
    }

    public Optional<SocketTicketPrincipal> resolve(String ticket) {
        if (StrUtil.isBlank(ticket)) {
            return Optional.empty();
        }
        String raw = redisson.<String>getBucket(REDIS_PREFIX + ticket).get();
        if (StrUtil.isBlank(raw)) {
            return Optional.empty();
        }
        int idx = raw.indexOf(SEP);
        if (idx <= 0 || idx >= raw.length() - 1) {
            // legacy username-only tickets: reject (TTL 2min; force re-issue with userId)
            return Optional.empty();
        }
        String userId = raw.substring(0, idx).trim();
        String username = raw.substring(idx + 1).trim();
        if (StrUtil.isBlank(userId) || StrUtil.isBlank(username)) {
            return Optional.empty();
        }
        return Optional.of(new SocketTicketPrincipal(userId, username));
    }

    public Optional<String> resolveUsername(String ticket) {
        return resolve(ticket).map(SocketTicketPrincipal::username);
    }
}
