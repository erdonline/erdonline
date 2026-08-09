-- ADR-0028：官方模板广场（catalog_template / rating / install / submission）
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `catalog_template` (
  `id` varchar(64) NOT NULL COMMENT '模板 id（slug 风格）',
  `slug` varchar(128) NOT NULL COMMENT 'URL slug',
  `title` varchar(200) NOT NULL COMMENT '展示标题',
  `description` varchar(1000) DEFAULT NULL COMMENT '简介',
  `tags` varchar(500) DEFAULT NULL COMMENT '逗号分隔标签',
  `author_handle` varchar(128) NOT NULL COMMENT '作者 GitHub handle 或 erdonline',
  `author_display_name` varchar(200) DEFAULT NULL COMMENT '作者展示名',
  `project_json` json NOT NULL COMMENT 'projectJSON 快照（已清 profile.dbs）',
  `config_json` json DEFAULT NULL COMMENT 'configJSON 快照',
  `status` varchar(32) NOT NULL DEFAULT 'published' COMMENT 'published|pending|rejected',
  `install_count` int NOT NULL DEFAULT 0 COMMENT '去重安装数',
  `rating_sum` int NOT NULL DEFAULT 0 COMMENT '评分总和',
  `rating_count` int NOT NULL DEFAULT 0 COMMENT '评分人数',
  `source_project_id` varchar(64) DEFAULT NULL COMMENT '来源项目（社区发布）',
  `del_flag` char(1) NOT NULL DEFAULT '0',
  `creator` varchar(64) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `updater` varchar(64) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_catalog_template_slug` (`slug`),
  KEY `idx_catalog_template_status` (`status`),
  KEY `idx_catalog_template_author` (`author_handle`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='官方/社区模板目录';

CREATE TABLE IF NOT EXISTS `catalog_rating` (
  `id` varchar(64) NOT NULL,
  `template_id` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `score` tinyint NOT NULL COMMENT '1-5',
  `del_flag` char(1) NOT NULL DEFAULT '0',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_catalog_rating_template_user` (`template_id`, `user_id`),
  KEY `idx_catalog_rating_template` (`template_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='模板评分（每用户每模板一票）';

CREATE TABLE IF NOT EXISTS `catalog_install` (
  `id` varchar(64) NOT NULL,
  `template_id` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `project_id` varchar(64) DEFAULT NULL COMMENT '安装后项目 id',
  `del_flag` char(1) NOT NULL DEFAULT '0',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_catalog_install_template_user` (`template_id`, `user_id`),
  KEY `idx_catalog_install_template` (`template_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='模板安装记录（去重计数）';

CREATE TABLE IF NOT EXISTS `catalog_submission` (
  `id` varchar(64) NOT NULL,
  `project_id` varchar(64) NOT NULL,
  `submitter_user_id` varchar(64) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `tags` varchar(500) DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'pending' COMMENT 'pending|approved|rejected',
  `reviewer_user_id` varchar(64) DEFAULT NULL,
  `review_note` varchar(500) DEFAULT NULL,
  `template_id` varchar(64) DEFAULT NULL COMMENT '审核通过后生成的模板 id',
  `del_flag` char(1) NOT NULL DEFAULT '0',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_catalog_submission_status` (`status`),
  KEY `idx_catalog_submission_submitter` (`submitter_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='社区模板发布队列';
