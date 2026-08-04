-- ADR-0013 post-MVP：refresh_token（仅 authorization_code 换票签发）。
-- 明文前缀 erd_ort_；库中仅 SHA-256。轮换 + 复用检测（family_id）。
-- client_credentials 不发 refresh。幂等：空卷 Flyway 与已有库均可重入。

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'oauth_access_token'
      AND COLUMN_NAME = 'family_id'
);
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE `oauth_access_token` ADD COLUMN `family_id` varchar(32) DEFAULT NULL COMMENT ''refresh 轮换族；client_credentials 为空'' AFTER `scopes`',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'oauth_access_token'
      AND INDEX_NAME = 'idx_oauth_access_family'
);
SET @sql := IF(@idx_exists = 0,
    'ALTER TABLE `oauth_access_token` ADD KEY `idx_oauth_access_family` (`family_id`)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `oauth_refresh_token` (
  `id` varchar(32) NOT NULL COMMENT '主键',
  `token_hash` char(64) NOT NULL COMMENT 'SHA-256 hex（refresh_token 明文）',
  `token_hint` varchar(12) NOT NULL COMMENT '末尾可见片段',
  `family_id` varchar(32) NOT NULL COMMENT '轮换族；复用已吊销成员则整族失效',
  `client_pk` varchar(32) NOT NULL COMMENT 'oauth_api_client.id',
  `client_id` varchar(64) NOT NULL COMMENT '公开客户端 id',
  `user_id` varchar(45) NOT NULL COMMENT '授权用户',
  `username` varchar(64) NOT NULL COMMENT '用户名',
  `scopes` varchar(512) NOT NULL COMMENT '本票 scope（⊆ client.scopes）',
  `expire_time` datetime NOT NULL COMMENT '过期时间',
  `revoked` char(1) NOT NULL DEFAULT '0' COMMENT '0 有效 / 1 已吊销（轮换或吊销）',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '0 正常 / 1 删除',
  `creator` varchar(45) DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updater` varchar(45) DEFAULT NULL,
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_oauth_refresh_token_hash` (`token_hash`),
  KEY `idx_oauth_refresh_client_pk` (`client_pk`),
  KEY `idx_oauth_refresh_family` (`family_id`),
  KEY `idx_oauth_refresh_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='OAuth refresh_token（ADR-0013 post-MVP）';
