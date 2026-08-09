-- ADR-0028 P1：评论 / 举报 / 限制 + 作者开关评论
SET NAMES utf8mb4;

ALTER TABLE `catalog_template`
  ADD COLUMN `comments_enabled` tinyint NOT NULL DEFAULT 1 COMMENT '1=开 0=关' AFTER `source_project_id`;

CREATE TABLE IF NOT EXISTS `catalog_comment` (
  `id` varchar(64) NOT NULL,
  `template_id` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `username` varchar(128) DEFAULT NULL COMMENT '展示名快照',
  `body` varchar(2000) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'visible' COMMENT 'visible|hidden_pending|hidden|restricted',
  `report_count` int NOT NULL DEFAULT 0,
  `del_flag` char(1) NOT NULL DEFAULT '0',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_catalog_comment_template` (`template_id`),
  KEY `idx_catalog_comment_user` (`user_id`),
  KEY `idx_catalog_comment_template_user_time` (`template_id`, `user_id`, `create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='模板评论';

CREATE TABLE IF NOT EXISTS `catalog_comment_report` (
  `id` varchar(64) NOT NULL,
  `comment_id` varchar(64) NOT NULL,
  `reporter_user_id` varchar(64) NOT NULL,
  `reason` varchar(500) DEFAULT NULL,
  `del_flag` char(1) NOT NULL DEFAULT '0',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_catalog_comment_report` (`comment_id`, `reporter_user_id`),
  KEY `idx_catalog_comment_report_comment` (`comment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论举报';

CREATE TABLE IF NOT EXISTS `catalog_comment_restriction` (
  `id` varchar(64) NOT NULL,
  `template_id` varchar(64) NOT NULL,
  `restricted_user_id` varchar(64) NOT NULL,
  `restricted_by_user_id` varchar(64) NOT NULL,
  `del_flag` char(1) NOT NULL DEFAULT '0',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_catalog_restriction_template_user` (`template_id`, `restricted_user_id`),
  KEY `idx_catalog_restriction_template` (`template_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='模板评论者限制（作者/维护者）';
