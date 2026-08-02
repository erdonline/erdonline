package com.erdonline.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.data.redis.RedisProperties;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Logs the bound Redis host/port (never password) so Railway Deploy logs show what won.
 */
@Component
@Order(0)
public class RedisResolvedConnectionLogger implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(RedisResolvedConnectionLogger.class);

    private final RedisProperties redisProperties;
    private final Environment environment;

    public RedisResolvedConnectionLogger(RedisProperties redisProperties, Environment environment) {
        this.redisProperties = redisProperties;
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {
        String via = environment.getProperty(
                RedisUrlAliasEnvironmentPostProcessor.RESOLVED_SOURCE_PROPERTY, "unknown");
        log.info(
                "Redis bound host={} port={} database={} via={}",
                redisProperties.getHost(),
                redisProperties.getPort(),
                redisProperties.getDatabase(),
                via);
    }
}
