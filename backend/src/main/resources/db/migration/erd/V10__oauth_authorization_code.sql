-- ADR-0013 OAuth 切片 B：Authorization Code + PKCE（S256）。
-- auth code 仅存 SHA-256 hex；短期单次使用。client 增 type / redirect_uris。
-- 幂等：空卷 Flyway 与已有库均可重入。

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'oauth_api_client'
      AND COLUMN_NAME = 'client_type'
);
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE `oauth_api_client` ADD COLUMN `client_type` varchar(16) NOT NULL DEFAULT ''confidential'' COMMENT ''confidential|public'' AFTER `name`',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'oauth_api_client'
      AND COLUMN_NAME = 'redirect_uris'
);
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE `oauth_api_client` ADD COLUMN `redirect_uris` varchar(2048) DEFAULT NULL COMMENT ''精确匹配 redirect_uri，换行分隔'' AFTER `scopes`',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS `oauth_authorization_code` (
  `id` varchar(32) NOT NULL COMMENT '主键',
  `code_hash` char(64) NOT NULL COMMENT 'SHA-256 hex（authorization code 明文）',
  `client_pk` varchar(32) NOT NULL COMMENT 'oauth_api_client.id',
  `client_id` varchar(64) NOT NULL COMMENT '公开客户端 id',
  `user_id` varchar(45) NOT NULL COMMENT '授权用户 sys_user.id（OAT 以其身份访问）',
  `username` varchar(64) NOT NULL COMMENT '授权用户名',
  `redirect_uri` varchar(512) NOT NULL COMMENT '签发时绑定的 redirect_uri（换票须一致）',
  `scopes` varchar(512) NOT NULL COMMENT '本码实际 scope（⊆ client.scopes）',
  `code_challenge` varchar(128) NOT NULL COMMENT 'PKCE S256 challenge',
  `code_challenge_method` varchar(16) NOT NULL DEFAULT 'S256' COMMENT '仅允许 S256',
  `expire_time` datetime NOT NULL COMMENT '过期时间（短寿命）',
  `consumed` char(1) NOT NULL DEFAULT '0' COMMENT '0 未用 / 1 已消费',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '0 正常 / 1 删除',
  `creator` varchar(45) DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updater` varchar(45) DEFAULT NULL,
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_oauth_auth_code_hash` (`code_hash`),
  KEY `idx_oauth_auth_code_client_pk` (`client_pk`),
  KEY `idx_oauth_auth_code_user_id` (`user_id`),
  KEY `idx_oauth_auth_code_expire` (`expire_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='OAuth authorization_code（ADR-0013 切片 B）';
