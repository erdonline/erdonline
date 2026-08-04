-- ADR-0013 OAuth 切片 A：第三方 API client（client_credentials）+ 短期 access token。
-- client_secret / access_token 仅存 SHA-256 hex；明文只在铸造/换票响应出现一次。
-- 幂等：空卷 Flyway 与已有库均可重入。Authorization Code / PKCE 后置切片 B。

CREATE TABLE IF NOT EXISTS `oauth_api_client` (
  `id` varchar(32) NOT NULL COMMENT '主键',
  `client_id` varchar(64) NOT NULL COMMENT '公开客户端 id（erd_cli_…）',
  `user_id` varchar(45) NOT NULL COMMENT '所属用户 sys_user.id（token 以该用户身份访问 /api/v1）',
  `username` varchar(64) NOT NULL COMMENT '注册时用户名（鉴权免跨查）',
  `name` varchar(64) NOT NULL COMMENT '人类可读名称',
  `client_secret_hash` char(64) NOT NULL COMMENT 'SHA-256 hex（client_secret）',
  `client_secret_hint` varchar(12) NOT NULL COMMENT '末尾可见片段，列表展示',
  `scopes` varchar(512) NOT NULL COMMENT '逗号分隔 scope（上限；与 PatScopes 对齐）',
  `revoked` char(1) NOT NULL DEFAULT '0' COMMENT '0 有效 / 1 已吊销',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '0 正常 / 1 删除',
  `creator` varchar(45) DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updater` varchar(45) DEFAULT NULL,
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_oauth_client_id` (`client_id`),
  UNIQUE KEY `uk_oauth_client_secret_hash` (`client_secret_hash`),
  KEY `idx_oauth_client_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='公开 API OAuth client（ADR-0013 切片 A）';

CREATE TABLE IF NOT EXISTS `oauth_access_token` (
  `id` varchar(32) NOT NULL COMMENT '主键',
  `client_pk` varchar(32) NOT NULL COMMENT 'oauth_api_client.id',
  `client_id` varchar(64) NOT NULL COMMENT '公开客户端 id（冗余便于审计）',
  `user_id` varchar(45) NOT NULL COMMENT '所属用户',
  `username` varchar(64) NOT NULL COMMENT '用户名',
  `token_hash` char(64) NOT NULL COMMENT 'SHA-256 hex（access_token 明文）',
  `token_hint` varchar(12) NOT NULL COMMENT '末尾可见片段',
  `scopes` varchar(512) NOT NULL COMMENT '本票实际 scope（⊆ client.scopes）',
  `expire_time` datetime NOT NULL COMMENT '过期时间',
  `revoked` char(1) NOT NULL DEFAULT '0' COMMENT '0 有效 / 1 已吊销',
  `last_used_time` datetime DEFAULT NULL COMMENT '最近一次成功鉴权',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '0 正常 / 1 删除',
  `creator` varchar(45) DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updater` varchar(45) DEFAULT NULL,
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_oauth_access_token_hash` (`token_hash`),
  KEY `idx_oauth_access_client_pk` (`client_pk`),
  KEY `idx_oauth_access_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='OAuth client_credentials access token（ADR-0013）';
