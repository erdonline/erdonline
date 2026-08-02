package com.erdonline.config;

import java.net.URI;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.data.redis.RedisProperties;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Logs bound Redis target (never secrets) so Deploy logs show whether URL or host won.
 */
@Component
@Order(0)
public class RedisResolvedConnectionLogger implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(RedisResolvedConnectionLogger.class);

    private final RedisProperties redisProperties;

    public RedisResolvedConnectionLogger(RedisProperties redisProperties) {
        this.redisProperties = redisProperties;
    }

    @Override
    public void run(ApplicationArguments args) {
        String host = redisProperties.getHost();
        int port = redisProperties.getPort();
        boolean urlSet = StringUtils.hasText(redisProperties.getUrl());
        boolean passwordSet = StringUtils.hasText(redisProperties.getPassword());

        if (urlSet) {
            try {
                URI uri = URI.create(redisProperties.getUrl().trim());
                if (StringUtils.hasText(uri.getHost())) {
                    host = uri.getHost();
                }
                if (uri.getPort() > 0) {
                    port = uri.getPort();
                }
                if (!passwordSet && StringUtils.hasText(uri.getUserInfo()) && uri.getUserInfo().contains(":")) {
                    String pass = uri.getUserInfo().substring(uri.getUserInfo().indexOf(':') + 1);
                    passwordSet = StringUtils.hasText(pass);
                }
            } catch (IllegalArgumentException ignored) {
                // keep RedisProperties host/port
            }
        }

        log.info(
                "Redis bound host={} port={} database={} url={} password={}",
                host,
                port,
                redisProperties.getDatabase(),
                urlSet ? "set" : "missing",
                passwordSet ? "set" : "missing");
    }
}
