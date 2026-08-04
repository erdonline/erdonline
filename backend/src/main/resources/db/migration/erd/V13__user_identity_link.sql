-- ADR-0021：第三方 IdP 联邦身份链接。仅存 provider subject，无 token/secret。
-- 幂等：空卷 Flyway 与已有库均可重入。

CREATE TABLE IF NOT EXISTS `user_identity_link` (
  `id` varchar(32) NOT NULL COMMENT '主键',
  `user_id` varchar(45) NOT NULL COMMENT 'sys_user.id',
  `provider` varchar(32) NOT NULL COMMENT 'google | wechat',
  `subject` varchar(128) NOT NULL COMMENT 'IdP subject（google sub / wechat unionid或openid）',
  `union_id` varchar(128) DEFAULT NULL COMMENT '微信 unionid（可选）',
  `email` varchar(128) DEFAULT NULL COMMENT 'IdP 声明邮箱（可空）',
  `display_name` varchar(128) DEFAULT NULL COMMENT 'IdP 显示名',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '0 正常 / 1 删除',
  `creator` varchar(45) DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updater` varchar(45) DEFAULT NULL,
  `update_time` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_identity_provider_subject` (`provider`, `subject`),
  KEY `idx_identity_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='第三方登录身份链接（ADR-0021）';
