package com.erdonline.auth.federate;

import cn.hutool.core.util.IdUtil;
import lombok.RequiredArgsConstructor;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.Optional;

/**
 * OAuth state / 登录短票（Redis）。
 */
@Component
@RequiredArgsConstructor
public class FederateStateStore {

    public static final String STATE_PREFIX = "erd:federate:state:";
    public static final String SESSION_PREFIX = "erd:federate:session:";
    public static final Duration STATE_TTL = Duration.ofMinutes(10);
    public static final Duration SESSION_TTL = Duration.ofMinutes(2);

    /** wire: mode|provider|userId|redirect — userId/redirect 可空，用空串占位 */
    private static final char SEP = '|';

    private final RedissonClient redisson;

    public String putState(String mode, FederateProvider provider, String userId, String redirect) {
        String state = IdUtil.fastSimpleUUID();
        String payload = mode
                + SEP + provider.wire()
                + SEP + nullToEmpty(userId)
                + SEP + nullToEmpty(redirect);
        RBucket<String> bucket = redisson.getBucket(STATE_PREFIX + state);
        bucket.set(payload, STATE_TTL);
        return state;
    }

    public Optional<FederateState> takeState(String state) {
        if (!StringUtils.hasText(state)) {
            return Optional.empty();
        }
        RBucket<String> bucket = redisson.getBucket(STATE_PREFIX + state);
        String raw = bucket.getAndDelete();
        if (!StringUtils.hasText(raw)) {
            return Optional.empty();
        }
        String[] parts = raw.split("\\" + SEP, -1);
        if (parts.length < 4) {
            return Optional.empty();
        }
        try {
            return Optional.of(new FederateState(
                    parts[0],
                    FederateProvider.fromWire(parts[1]),
                    emptyToNull(parts[2]),
                    emptyToNull(parts[3])));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    public String putSessionTicket(String accessTokenJson) {
        String ticket = IdUtil.fastSimpleUUID();
        RBucket<String> bucket = redisson.getBucket(SESSION_PREFIX + ticket);
        bucket.set(accessTokenJson, SESSION_TTL);
        return ticket;
    }

    public Optional<String> takeSessionTicket(String ticket) {
        if (!StringUtils.hasText(ticket)) {
            return Optional.empty();
        }
        RBucket<String> bucket = redisson.getBucket(SESSION_PREFIX + ticket);
        String raw = bucket.getAndDelete();
        return StringUtils.hasText(raw) ? Optional.of(raw) : Optional.empty();
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    private static String emptyToNull(String s) {
        return StringUtils.hasText(s) ? s : null;
    }

    public record FederateState(String mode, FederateProvider provider, String userId, String redirect) {
    }
}
