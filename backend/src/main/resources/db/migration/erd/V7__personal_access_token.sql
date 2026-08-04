-- ADR-0013 切片 1：个人访问令牌（PAT）。仅存 SHA-256 哈希，明文只在创建响应出现一次。
-- 幂等：空卷 Flyway 与已有库均可重入。

CREATE TABLE IF NOT EXISTS `personal_access_token` (
  `id` varchar(32) NOT NULL COMMENT '主键',
  `user_id` varchar(45) NOT NULL COMMENT '所属用户 sys_user.id',
  `username` varchar(64) NOT NULL COMMENT '铸造时用户名（鉴权免跨查）',
  `name` varchar(64) NOT NULL COMMENT '人类可读名称',
  `token_hash` char(64) NOT NULL COMMENT 'SHA-256 hex（全量 token）',
  `token_hint` varchar(12) NOT NULL COMMENT '末尾可见片段，列表展示',
  `scopes` varchar(512) NOT NULL COMMENT '逗号分隔 scope，如 projects:read,versions:read',
  `expire_time` datetime DEFAULT NULL COMMENT '过期时间，空=不过期',
  `revoked` char(1) NOT NULL DEFAULT '0' COMMENT '0 有效 / 1 已吊销',
  `last_used_time` datetime DEFAULT NULL COMMENT '最近一次成功鉴权',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '0 正常 / 1 删除',
  `creator` varchar(45) DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updater` varchar(45) DEFAULT NULL,
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pat_token_hash` (`token_hash`),
  KEY `idx_pat_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='公开 API 个人访问令牌（ADR-0013）';
