USE martin;

/*
去navicate导出结构+数据
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for oauth_client_details
-- ----------------------------
DROP TABLE IF EXISTS `oauth_client_details`;
CREATE TABLE `oauth_client_details` (
                                        `ID` varchar(45) NOT NULL COMMENT '主键',
                                        `CLIENT_ID` varchar(48) NOT NULL COMMENT '客户端唯一标识',
                                        `CLIENT_SECRET` varchar(256) NOT NULL COMMENT '客户端密码,必须要有前缀代表加密方式',
                                        `RESOURCE_IDS` varchar(256) DEFAULT NULL COMMENT '客户端能访问的资源id集合,不能为空，用逗号分隔',
                                        `SCOPE` varchar(256) NOT NULL COMMENT '围client的权限范围',
                                        `AUTHORIZED_GRANT_TYPES` varchar(256) DEFAULT NULL COMMENT '授权模式(可选值 授权码模式:authorization_code,密码模式:password,刷新token: refresh_token, 隐式模式: implicit: 客户端模式: client_credentials。支持多个用逗号分隔)',
                                        `WEB_SERVER_REDIRECT_URI` varchar(256) DEFAULT NULL COMMENT '客户端重定向uri',
                                        `AUTHORITIES` varchar(256) DEFAULT NULL COMMENT '指定用户的权限范围，implicit和client_credentials需要',
                                        `ACCESS_TOKEN_VALIDITY` int DEFAULT NULL COMMENT '设置access_token的有效时间(秒),默认(606012,12小时)',
                                        `REFRESH_TOKEN_VALIDITY` int DEFAULT NULL COMMENT '设置refresh_token有效期(秒)，默认(606024*30, 30填)',
                                        `ADDITIONAL_INFORMATION` varchar(4096) DEFAULT NULL COMMENT '额外的信息，值必须是json格式',
                                        `AUTOAPPROVE` varchar(256) DEFAULT NULL COMMENT '默认false,适用于authorization_code模式,设置用户是否自动approval操作,设置true跳过用户确认授权操作页面，直接跳到redirect_uri',
                                        `CREATOR` varchar(45) DEFAULT NULL COMMENT '创建人',
                                        `UPDATER` varchar(45) DEFAULT NULL COMMENT '修改人',
                                        PRIMARY KEY (`ID`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='oauth2客户端 ';

-- ----------------------------
-- Records of oauth_client_details
-- ----------------------------
BEGIN;
INSERT INTO `oauth_client_details` VALUES ('1', 'client1', '{bcrypt}$2a$10$gESiyFVZEXfaE9RWHoRhxOLxv7YKSg.n1bd0gWRqwZgGPcN2Rcn5i', NULL, 'select', 'client_credentials,refresh_token', NULL, NULL, NULL, NULL, NULL, NULL, '2', '2');
INSERT INTO `oauth_client_details` VALUES ('2', 'client2', '{bcrypt}$2a$10$gESiyFVZEXfaE9RWHoRhxOLxv7YKSg.n1bd0gWRqwZgGPcN2Rcn5i', NULL, 'select', 'password,refresh_token', NULL, NULL, NULL, NULL, NULL, NULL, '2', '2');
INSERT INTO `oauth_client_details` VALUES ('3', 'client3', '{bcrypt}$2a$10$gESiyFVZEXfaE9RWHoRhxOLxv7YKSg.n1bd0gWRqwZgGPcN2Rcn5i', NULL, 'select', 'authorization_code,refresh_token', 'http://127.0.0.1:9402/login,http://127.0.0.1:9403/login', NULL, NULL, NULL, NULL, NULL, '2', '2');
INSERT INTO `oauth_client_details` VALUES ('4', 'client4', '{bcrypt}$2a$10$gESiyFVZEXfaE9RWHoRhxOLxv7YKSg.n1bd0gWRqwZgGPcN2Rcn5i', NULL, 'select', 'implicit', NULL, NULL, NULL, NULL, NULL, NULL, '2', '2');
COMMIT;

-- ----------------------------
-- Table structure for QRTZ_BLOB_TRIGGERS
-- ----------------------------
DROP TABLE IF EXISTS `QRTZ_BLOB_TRIGGERS`;
CREATE TABLE `QRTZ_BLOB_TRIGGERS` (
                                      `SCHED_NAME` varchar(120) NOT NULL,
                                      `TRIGGER_NAME` varchar(190) NOT NULL,
                                      `TRIGGER_GROUP` varchar(190) NOT NULL,
                                      `BLOB_DATA` blob,
                                      PRIMARY KEY (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
                                      KEY `SCHED_NAME` (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
                                      CONSTRAINT `qrtz_blob_triggers_ibfk_1` FOREIGN KEY (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`) REFERENCES `QRTZ_TRIGGERS` (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- ----------------------------
-- Records of QRTZ_BLOB_TRIGGERS
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for QRTZ_CALENDARS
-- ----------------------------
DROP TABLE IF EXISTS `QRTZ_CALENDARS`;
CREATE TABLE `QRTZ_CALENDARS` (
                                  `SCHED_NAME` varchar(120) NOT NULL,
                                  `CALENDAR_NAME` varchar(190) NOT NULL,
                                  `CALENDAR` blob NOT NULL,
                                  PRIMARY KEY (`SCHED_NAME`,`CALENDAR_NAME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- ----------------------------
-- Records of QRTZ_CALENDARS
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for QRTZ_CRON_TRIGGERS
-- ----------------------------
DROP TABLE IF EXISTS `QRTZ_CRON_TRIGGERS`;
CREATE TABLE `QRTZ_CRON_TRIGGERS` (
                                      `SCHED_NAME` varchar(120) NOT NULL,
                                      `TRIGGER_NAME` varchar(190) NOT NULL,
                                      `TRIGGER_GROUP` varchar(190) NOT NULL,
                                      `CRON_EXPRESSION` varchar(120) NOT NULL,
                                      `TIME_ZONE_ID` varchar(80) DEFAULT NULL,
                                      PRIMARY KEY (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
                                      CONSTRAINT `qrtz_cron_triggers_ibfk_1` FOREIGN KEY (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`) REFERENCES `QRTZ_TRIGGERS` (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- ----------------------------
-- Records of QRTZ_CRON_TRIGGERS
-- ----------------------------
BEGIN;
INSERT INTO `QRTZ_CRON_TRIGGERS` VALUES ('MartinScheduler', 'martinjob', 'martin', '*/8 * * * * ?', 'Asia/Shanghai');
INSERT INTO `QRTZ_CRON_TRIGGERS` VALUES ('MartinScheduler', 'martinjob1', 'martin1', '*/5 * * * * ?', 'Asia/Shanghai');
INSERT INTO `QRTZ_CRON_TRIGGERS` VALUES ('MartinScheduler', 'martinjob2', 'martin2', '*/5 * * * * ?', 'Asia/Shanghai');
COMMIT;

-- ----------------------------
-- Table structure for QRTZ_FIRED_TRIGGERS
-- ----------------------------
DROP TABLE IF EXISTS `QRTZ_FIRED_TRIGGERS`;
CREATE TABLE `QRTZ_FIRED_TRIGGERS` (
                                       `SCHED_NAME` varchar(120) NOT NULL,
                                       `ENTRY_ID` varchar(95) NOT NULL,
                                       `TRIGGER_NAME` varchar(190) NOT NULL,
                                       `TRIGGER_GROUP` varchar(190) NOT NULL,
                                       `INSTANCE_NAME` varchar(190) NOT NULL,
                                       `FIRED_TIME` bigint NOT NULL,
                                       `SCHED_TIME` bigint NOT NULL,
                                       `PRIORITY` int NOT NULL,
                                       `STATE` varchar(16) NOT NULL,
                                       `JOB_NAME` varchar(190) DEFAULT NULL,
                                       `JOB_GROUP` varchar(190) DEFAULT NULL,
                                       `IS_NONCONCURRENT` varchar(1) DEFAULT NULL,
                                       `REQUESTS_RECOVERY` varchar(1) DEFAULT NULL,
                                       PRIMARY KEY (`SCHED_NAME`,`ENTRY_ID`),
                                       KEY `IDX_QRTZ_FT_TRIG_INST_NAME` (`SCHED_NAME`,`INSTANCE_NAME`),
                                       KEY `IDX_QRTZ_FT_INST_JOB_REQ_RCVRY` (`SCHED_NAME`,`INSTANCE_NAME`,`REQUESTS_RECOVERY`),
                                       KEY `IDX_QRTZ_FT_J_G` (`SCHED_NAME`,`JOB_NAME`,`JOB_GROUP`),
                                       KEY `IDX_QRTZ_FT_JG` (`SCHED_NAME`,`JOB_GROUP`),
                                       KEY `IDX_QRTZ_FT_T_G` (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
                                       KEY `IDX_QRTZ_FT_TG` (`SCHED_NAME`,`TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- ----------------------------
-- Records of QRTZ_FIRED_TRIGGERS
-- ----------------------------
BEGIN;
INSERT INTO `QRTZ_FIRED_TRIGGERS` VALUES ('MartinScheduler', 'NON_CLUSTERED1616062562260', 'MT_1f656a551tyd5', 'DEFAULT', 'NON_CLUSTERED', 1616063202163, 1616063160459, 5, 'EXECUTING', 'martinjob', 'martin', '0', '0');
INSERT INTO `QRTZ_FIRED_TRIGGERS` VALUES ('MartinScheduler', 'NON_CLUSTERED1616062562264', 'MT_dall0dj69ht85', 'DEFAULT', 'NON_CLUSTERED', 1616063202339, 1616063184057, 5, 'EXECUTING', 'martinjob', 'martin', '0', '0');
COMMIT;

-- ----------------------------
-- Table structure for QRTZ_HISTORY
-- ----------------------------
DROP TABLE IF EXISTS `QRTZ_HISTORY`;
CREATE TABLE `QRTZ_HISTORY` (
                                `ID` int NOT NULL AUTO_INCREMENT COMMENT '主键',
                                `SCHED_NAME` varchar(120) NOT NULL COMMENT '调度器名称',
                                `TRIGGER_NAME` varchar(190) NOT NULL COMMENT '触发器名称',
                                `TRIGGER_GROUP` varchar(190) NOT NULL COMMENT '触发器分组',
                                `JOB_NAME` varchar(190) NOT NULL COMMENT '任务名称',
                                `JOB_GROUP` varchar(190) NOT NULL COMMENT '任务分组',
                                `JOB_STATUS` varchar(10) DEFAULT NULL COMMENT '任务执行状态',
                                `NEXT_FIRE_TIME` bigint DEFAULT NULL COMMENT '下次执行时间',
                                `PREV_FIRE_TIME` bigint DEFAULT NULL COMMENT '上次执行时间',
                                `JOB_DATA` varchar(200) DEFAULT NULL COMMENT '任务执行记录日志',
                                `DEL_FLAG` char(1) DEFAULT NULL COMMENT '删除标识（0-正常,1-删除）',
                                `CREATE_TIME` datetime DEFAULT NULL COMMENT '创建时间',
                                `UPDATE_TIME` datetime DEFAULT NULL COMMENT '更新时间',
                                `CREATOR` varchar(45) DEFAULT NULL COMMENT '创建人',
                                `UPDATER` varchar(45) DEFAULT NULL COMMENT '修改人',
                                PRIMARY KEY (`ID`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1031 DEFAULT CHARSET=utf8mb3;

-- ----------------------------
-- Records of QRTZ_HISTORY
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for QRTZ_JOB_DETAILS
-- ----------------------------
DROP TABLE IF EXISTS `QRTZ_JOB_DETAILS`;
CREATE TABLE `QRTZ_JOB_DETAILS` (
                                    `SCHED_NAME` varchar(120) NOT NULL,
                                    `JOB_NAME` varchar(190) NOT NULL,
                                    `JOB_GROUP` varchar(190) NOT NULL,
                                    `DESCRIPTION` varchar(250) DEFAULT NULL,
                                    `JOB_CLASS_NAME` varchar(250) NOT NULL,
                                    `IS_DURABLE` varchar(1) NOT NULL,
                                    `IS_NONCONCURRENT` varchar(1) NOT NULL,
                                    `IS_UPDATE_DATA` varchar(1) NOT NULL,
                                    `REQUESTS_RECOVERY` varchar(1) NOT NULL,
                                    `JOB_DATA` blob,
                                    PRIMARY KEY (`SCHED_NAME`,`JOB_NAME`,`JOB_GROUP`),
                                    KEY `IDX_QRTZ_J_REQ_RECOVERY` (`SCHED_NAME`,`REQUESTS_RECOVERY`),
                                    KEY `IDX_QRTZ_J_GRP` (`SCHED_NAME`,`JOB_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- ----------------------------
-- Records of QRTZ_JOB_DETAILS
-- ----------------------------
BEGIN;
INSERT INTO `QRTZ_JOB_DETAILS` VALUES ('MartinScheduler', 'martinjob', 'martin', NULL, 'com.java2e.martin.extension.quartz.job.TestJob', '0', '0', '0', '0', 0xACED0005737200156F72672E71756172747A2E4A6F62446174614D61709FB083E8BFA9B0CB020000787200266F72672E71756172747A2E7574696C732E537472696E674B65794469727479466C61674D61708208E8C3FBC55D280200015A0013616C6C6F77735472616E7369656E74446174617872001D6F72672E71756172747A2E7574696C732E4469727479466C61674D617013E62EAD28760ACE0200025A000564697274794C00036D617074000F4C6A6176612F7574696C2F4D61703B787000737200116A6176612E7574696C2E486173684D61700507DAC1C31660D103000246000A6C6F6164466163746F724900097468726573686F6C6478703F40000000000010770800000010000000007800);
INSERT INTO `QRTZ_JOB_DETAILS` VALUES ('MartinScheduler', 'martinjob1', 'martin1', NULL, 'com.java2e.martin.extension.quartz.job.TestJob', '0', '0', '0', '0', 0xACED0005737200156F72672E71756172747A2E4A6F62446174614D61709FB083E8BFA9B0CB020000787200266F72672E71756172747A2E7574696C732E537472696E674B65794469727479466C61674D61708208E8C3FBC55D280200015A0013616C6C6F77735472616E7369656E74446174617872001D6F72672E71756172747A2E7574696C732E4469727479466C61674D617013E62EAD28760ACE0200025A000564697274794C00036D617074000F4C6A6176612F7574696C2F4D61703B787000737200116A6176612E7574696C2E486173684D61700507DAC1C31660D103000246000A6C6F6164466163746F724900097468726573686F6C6478703F40000000000010770800000010000000007800);
INSERT INTO `QRTZ_JOB_DETAILS` VALUES ('MartinScheduler', 'martinjob2', 'martin2', NULL, 'com.java2e.martin.extension.quartz.job.TestJob', '0', '0', '0', '0', 0xACED0005737200156F72672E71756172747A2E4A6F62446174614D61709FB083E8BFA9B0CB020000787200266F72672E71756172747A2E7574696C732E537472696E674B65794469727479466C61674D61708208E8C3FBC55D280200015A0013616C6C6F77735472616E7369656E74446174617872001D6F72672E71756172747A2E7574696C732E4469727479466C61674D617013E62EAD28760ACE0200025A000564697274794C00036D617074000F4C6A6176612F7574696C2F4D61703B787000737200116A6176612E7574696C2E486173684D61700507DAC1C31660D103000246000A6C6F6164466163746F724900097468726573686F6C6478703F40000000000010770800000010000000007800);
COMMIT;

-- ----------------------------
-- Table structure for QRTZ_LOCKS
-- ----------------------------
DROP TABLE IF EXISTS `QRTZ_LOCKS`;
CREATE TABLE `QRTZ_LOCKS` (
                              `SCHED_NAME` varchar(120) NOT NULL,
                              `LOCK_NAME` varchar(40) NOT NULL,
                              PRIMARY KEY (`SCHED_NAME`,`LOCK_NAME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- ----------------------------
-- Records of QRTZ_LOCKS
-- ----------------------------
BEGIN;
INSERT INTO `QRTZ_LOCKS` VALUES ('MartinScheduler', 'TRIGGER_ACCESS');
COMMIT;

-- ----------------------------
-- Table structure for QRTZ_PAUSED_TRIGGER_GRPS
-- ----------------------------
DROP TABLE IF EXISTS `QRTZ_PAUSED_TRIGGER_GRPS`;
CREATE TABLE `QRTZ_PAUSED_TRIGGER_GRPS` (
                                            `SCHED_NAME` varchar(120) NOT NULL,
                                            `TRIGGER_GROUP` varchar(190) NOT NULL,
                                            PRIMARY KEY (`SCHED_NAME`,`TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- ----------------------------
-- Records of QRTZ_PAUSED_TRIGGER_GRPS
-- ----------------------------
BEGIN;
INSERT INTO `QRTZ_PAUSED_TRIGGER_GRPS` VALUES ('MartinScheduler', 'DEFAULT');
INSERT INTO `QRTZ_PAUSED_TRIGGER_GRPS` VALUES ('MartinScheduler', 'martin');
INSERT INTO `QRTZ_PAUSED_TRIGGER_GRPS` VALUES ('MartinScheduler', 'martin1');
INSERT INTO `QRTZ_PAUSED_TRIGGER_GRPS` VALUES ('MartinScheduler', 'martin2');
INSERT INTO `QRTZ_PAUSED_TRIGGER_GRPS` VALUES ('MartinScheduler', '_$_ALL_GROUPS_PAUSED_$_');
COMMIT;

-- ----------------------------
-- Table structure for QRTZ_SCHEDULER_STATE
-- ----------------------------
DROP TABLE IF EXISTS `QRTZ_SCHEDULER_STATE`;
CREATE TABLE `QRTZ_SCHEDULER_STATE` (
                                        `SCHED_NAME` varchar(120) NOT NULL,
                                        `INSTANCE_NAME` varchar(190) NOT NULL,
                                        `LAST_CHECKIN_TIME` bigint NOT NULL,
                                        `CHECKIN_INTERVAL` bigint NOT NULL,
                                        PRIMARY KEY (`SCHED_NAME`,`INSTANCE_NAME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- ----------------------------
-- Records of QRTZ_SCHEDULER_STATE
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for QRTZ_SIMPLE_TRIGGERS
-- ----------------------------
DROP TABLE IF EXISTS `QRTZ_SIMPLE_TRIGGERS`;
CREATE TABLE `QRTZ_SIMPLE_TRIGGERS` (
                                        `SCHED_NAME` varchar(120) NOT NULL,
                                        `TRIGGER_NAME` varchar(190) NOT NULL,
                                        `TRIGGER_GROUP` varchar(190) NOT NULL,
                                        `REPEAT_COUNT` bigint NOT NULL,
                                        `REPEAT_INTERVAL` bigint NOT NULL,
                                        `TIMES_TRIGGERED` bigint NOT NULL,
                                        PRIMARY KEY (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
                                        CONSTRAINT `qrtz_simple_triggers_ibfk_1` FOREIGN KEY (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`) REFERENCES `QRTZ_TRIGGERS` (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- ----------------------------
-- Records of QRTZ_SIMPLE_TRIGGERS
-- ----------------------------
BEGIN;
INSERT INTO `QRTZ_SIMPLE_TRIGGERS` VALUES ('MartinScheduler', 'MT_1f656a551tyd5', 'DEFAULT', 0, 0, 1);
INSERT INTO `QRTZ_SIMPLE_TRIGGERS` VALUES ('MartinScheduler', 'MT_dall0dj69ht85', 'DEFAULT', 0, 0, 1);
INSERT INTO `QRTZ_SIMPLE_TRIGGERS` VALUES ('MartinScheduler', 'MT_fn5l5ytnguv', 'DEFAULT', 0, 0, 0);
COMMIT;

-- ----------------------------
-- Table structure for QRTZ_SIMPROP_TRIGGERS
-- ----------------------------
DROP TABLE IF EXISTS `QRTZ_SIMPROP_TRIGGERS`;
CREATE TABLE `QRTZ_SIMPROP_TRIGGERS` (
                                         `SCHED_NAME` varchar(120) NOT NULL,
                                         `TRIGGER_NAME` varchar(190) NOT NULL,
                                         `TRIGGER_GROUP` varchar(190) NOT NULL,
                                         `STR_PROP_1` varchar(512) DEFAULT NULL,
                                         `STR_PROP_2` varchar(512) DEFAULT NULL,
                                         `STR_PROP_3` varchar(512) DEFAULT NULL,
                                         `INT_PROP_1` int DEFAULT NULL,
                                         `INT_PROP_2` int DEFAULT NULL,
                                         `LONG_PROP_1` bigint DEFAULT NULL,
                                         `LONG_PROP_2` bigint DEFAULT NULL,
                                         `DEC_PROP_1` decimal(13,4) DEFAULT NULL,
                                         `DEC_PROP_2` decimal(13,4) DEFAULT NULL,
                                         `BOOL_PROP_1` varchar(1) DEFAULT NULL,
                                         `BOOL_PROP_2` varchar(1) DEFAULT NULL,
                                         PRIMARY KEY (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
                                         CONSTRAINT `qrtz_simprop_triggers_ibfk_1` FOREIGN KEY (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`) REFERENCES `QRTZ_TRIGGERS` (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- ----------------------------
-- Records of QRTZ_SIMPROP_TRIGGERS
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for QRTZ_TRIGGERS
-- ----------------------------
DROP TABLE IF EXISTS `QRTZ_TRIGGERS`;
CREATE TABLE `QRTZ_TRIGGERS` (
                                 `SCHED_NAME` varchar(120) NOT NULL,
                                 `TRIGGER_NAME` varchar(190) NOT NULL,
                                 `TRIGGER_GROUP` varchar(190) NOT NULL,
                                 `JOB_NAME` varchar(190) NOT NULL,
                                 `JOB_GROUP` varchar(190) NOT NULL,
                                 `DESCRIPTION` varchar(250) DEFAULT NULL,
                                 `NEXT_FIRE_TIME` bigint DEFAULT NULL,
                                 `PREV_FIRE_TIME` bigint DEFAULT NULL,
                                 `PRIORITY` int DEFAULT NULL,
                                 `TRIGGER_STATE` varchar(16) NOT NULL,
                                 `TRIGGER_TYPE` varchar(8) NOT NULL,
                                 `START_TIME` bigint NOT NULL,
                                 `END_TIME` bigint DEFAULT NULL,
                                 `CALENDAR_NAME` varchar(190) DEFAULT NULL,
                                 `MISFIRE_INSTR` smallint DEFAULT NULL,
                                 `JOB_DATA` blob,
                                 PRIMARY KEY (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
                                 KEY `IDX_QRTZ_T_J` (`SCHED_NAME`,`JOB_NAME`,`JOB_GROUP`),
                                 KEY `IDX_QRTZ_T_JG` (`SCHED_NAME`,`JOB_GROUP`),
                                 KEY `IDX_QRTZ_T_C` (`SCHED_NAME`,`CALENDAR_NAME`),
                                 KEY `IDX_QRTZ_T_G` (`SCHED_NAME`,`TRIGGER_GROUP`),
                                 KEY `IDX_QRTZ_T_STATE` (`SCHED_NAME`,`TRIGGER_STATE`),
                                 KEY `IDX_QRTZ_T_N_STATE` (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`,`TRIGGER_STATE`),
                                 KEY `IDX_QRTZ_T_N_G_STATE` (`SCHED_NAME`,`TRIGGER_GROUP`,`TRIGGER_STATE`),
                                 KEY `IDX_QRTZ_T_NEXT_FIRE_TIME` (`SCHED_NAME`,`NEXT_FIRE_TIME`),
                                 KEY `IDX_QRTZ_T_NFT_ST` (`SCHED_NAME`,`TRIGGER_STATE`,`NEXT_FIRE_TIME`),
                                 KEY `IDX_QRTZ_T_NFT_MISFIRE` (`SCHED_NAME`,`MISFIRE_INSTR`,`NEXT_FIRE_TIME`),
                                 KEY `IDX_QRTZ_T_NFT_ST_MISFIRE` (`SCHED_NAME`,`MISFIRE_INSTR`,`NEXT_FIRE_TIME`,`TRIGGER_STATE`),
                                 KEY `IDX_QRTZ_T_NFT_ST_MISFIRE_GRP` (`SCHED_NAME`,`MISFIRE_INSTR`,`NEXT_FIRE_TIME`,`TRIGGER_GROUP`,`TRIGGER_STATE`),
                                 CONSTRAINT `qrtz_triggers_ibfk_1` FOREIGN KEY (`SCHED_NAME`, `JOB_NAME`, `JOB_GROUP`) REFERENCES `QRTZ_JOB_DETAILS` (`SCHED_NAME`, `JOB_NAME`, `JOB_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- ----------------------------
-- Records of QRTZ_TRIGGERS
-- ----------------------------
BEGIN;
INSERT INTO `QRTZ_TRIGGERS` VALUES ('MartinScheduler', 'martinjob', 'martin', 'martinjob', 'martin', NULL, 1616063236000, 1616063228000, 5, 'PAUSED', 'CRON', 1615877879000, 0, NULL, 0, '');
INSERT INTO `QRTZ_TRIGGERS` VALUES ('MartinScheduler', 'martinjob1', 'martin1', 'martinjob1', 'martin1', NULL, 1616063130000, 1616063125000, 5, 'PAUSED', 'CRON', 1615880543000, 0, NULL, 0, '');
INSERT INTO `QRTZ_TRIGGERS` VALUES ('MartinScheduler', 'martinjob2', 'martin2', 'martinjob2', 'martin2', NULL, 1616063130000, 1616063125000, 5, 'PAUSED', 'CRON', 1615881322000, 0, NULL, 0, '');
INSERT INTO `QRTZ_TRIGGERS` VALUES ('MartinScheduler', 'MT_1f656a551tyd5', 'DEFAULT', 'martinjob', 'martin', NULL, -1, 1616063160459, 5, 'COMPLETE', 'SIMPLE', 1616063160459, 0, NULL, 0, '');
INSERT INTO `QRTZ_TRIGGERS` VALUES ('MartinScheduler', 'MT_dall0dj69ht85', 'DEFAULT', 'martinjob', 'martin', NULL, -1, 1616063184057, 5, 'COMPLETE', 'SIMPLE', 1616063184057, 0, NULL, 0, '');
INSERT INTO `QRTZ_TRIGGERS` VALUES ('MartinScheduler', 'MT_fn5l5ytnguv', 'DEFAULT', 'martinjob', 'martin', NULL, 1616063215849, -1, 5, 'PAUSED', 'SIMPLE', 1616063215849, 0, NULL, 0, '');
COMMIT;

-- ----------------------------
-- Table structure for sys_announcement
-- ----------------------------
DROP TABLE IF EXISTS `sys_announcement`;
CREATE TABLE `sys_announcement` (
                                    `id` varchar(32) COLLATE utf8mb4_general_ci NOT NULL COMMENT '主键',
                                    `title` varchar(128) COLLATE utf8mb4_general_ci NOT NULL COMMENT '标题',
                                    `content` varchar(1024) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '内容',
                                    `url` varchar(1024) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '跳转地址',
                                    `del_flag` char(1) COLLATE utf8mb4_general_ci DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                                    `revision` int DEFAULT NULL COMMENT '乐观锁',
                                    `creator` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '创建人',
                                    `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                    `updater` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '更新人',
                                    `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                                    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='公告表 ';

-- ----------------------------
-- Records of sys_announcement
-- ----------------------------
BEGIN;
INSERT INTO `sys_announcement` VALUES ('1709843585286803457', 'ERD Online 4.0.3数据库在线建模（免费、更美、更稳定）', NULL, 'https://github.com/orgs/www-zerocode-net-cn/discussions/6', '0', NULL, NULL, '2023-10-05 16:10:53', NULL, NULL);
INSERT INTO `sys_announcement` VALUES ('1709843763246927873', 'ERD Online 4.0.4 元数据在线建模（免费、私有部署）', NULL, 'https://github.com/orgs/www-zerocode-net-cn/discussions/4', '0', NULL, NULL, '2023-10-05 16:11:35', NULL, NULL);
INSERT INTO `sys_announcement` VALUES ('1709843881656324097', 'ERD Online 4.0.5 在线数据库建模、元数据管理（免费、私有部署）', NULL, 'https://github.com/orgs/www-zerocode-net-cn/discussions/3', '0', NULL, NULL, '2023-10-05 16:12:03', NULL, NULL);
INSERT INTO `sys_announcement` VALUES ('1709843988413943809', 'ERD Online 4.0.7 在线数据库建模、元数据管理（免费、私有部署）', NULL, 'https://github.com/orgs/www-zerocode-net-cn/discussions/24', '0', NULL, NULL, '2023-10-05 16:12:29', NULL, NULL);
INSERT INTO `sys_announcement` VALUES ('1709844084400590849', 'ERD Online 4.0.9 在线数据库建模、元数据管理平台（免费、私有部署）', NULL, 'https://github.com/orgs/www-zerocode-net-cn/discussions/34', '0', NULL, NULL, '2023-10-05 16:12:52', NULL, NULL);
INSERT INTO `sys_announcement` VALUES ('1709844168295059457', 'ERD Online 4.0.11 在线数据库建模、元数据协作平台（免费、私有部署）', NULL, 'https://github.com/orgs/www-zerocode-net-cn/discussions/39', '0', NULL, NULL, '2023-10-05 16:13:12', NULL, NULL);
INSERT INTO `sys_announcement` VALUES ('1709844318207873025', 'ERD Online 元数据生命周期分析', NULL, 'https://mp.weixin.qq.com/s/_nVDl3N_54rzsIb0mA7d6Q', '0', NULL, NULL, '2023-10-05 16:13:47', NULL, NULL);
INSERT INTO `sys_announcement` VALUES ('1709844581379477505', '解锁ERD Online 高级隐藏功能', NULL, 'https://mp.weixin.qq.com/s/tnIU_tpH5b52uySggVWc2Q', '0', NULL, NULL, '2023-10-05 16:14:50', NULL, NULL);
INSERT INTO `sys_announcement` VALUES ('1709844686702645250', 'ERDOnline对接ChatGPT，实现AI建模SQL自由', NULL, 'https://mp.weixin.qq.com/s/QC5d8OxUSZ-erhh2NKxK7A', '0', NULL, NULL, '2023-10-05 16:15:15', NULL, NULL);
COMMIT;

-- ----------------------------
-- Table structure for sys_code
-- ----------------------------
DROP TABLE IF EXISTS `sys_code`;
CREATE TABLE `sys_code` (
                            `id` varchar(45) NOT NULL COMMENT '主键',
                            `table_name` varchar(255) DEFAULT '' COMMENT '表名',
                            `table_comment` varchar(255) DEFAULT '' COMMENT '表注释',
                            `table_prefix` varchar(255) DEFAULT '' COMMENT '表前缀',
                            `module_name` varchar(255) DEFAULT '' COMMENT '所属模块',
                            `module_code` varchar(255) DEFAULT '' COMMENT '模块编码',
                            `parent` varchar(255) DEFAULT '' COMMENT '包名',
                            `author` varchar(50) DEFAULT NULL COMMENT '作者',
                            `db_url` varchar(200) DEFAULT NULL COMMENT 'url',
                            `db_driver_name` varchar(100) DEFAULT NULL COMMENT '驱动名称',
                            `db_username` varchar(100) DEFAULT NULL COMMENT '用户名',
                            `db_password` varchar(100) DEFAULT NULL COMMENT '密码',
                            `tenant_id` varchar(45) DEFAULT '0' COMMENT '所属租户',
                            `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                            `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                            `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                            `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
                            `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
                            `menu` varchar(255) DEFAULT NULL COMMENT '按钮',
                            PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统代码生成表';

-- ----------------------------
-- Records of sys_code
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for sys_config
-- ----------------------------
DROP TABLE IF EXISTS `sys_config`;
CREATE TABLE `sys_config` (
                              `ID` varchar(45) NOT NULL COMMENT '主键',
                              `NAME` varchar(50) DEFAULT NULL COMMENT '名称',
                              `VALUE` varchar(100) DEFAULT NULL COMMENT '配置值',
                              `TYPE` varchar(40) NOT NULL COMMENT '配置关键字',
                              `TENANT_ID` varchar(45) NOT NULL DEFAULT '0' COMMENT '租户',
                              `DEL_FLAG` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                              `CREATE_TIME` datetime DEFAULT NULL COMMENT '创建时间',
                              `UPDATE_TIME` datetime DEFAULT NULL COMMENT '更新时间',
                              `CREATOR` varchar(45) DEFAULT NULL COMMENT '创建人',
                              `UPDATER` varchar(45) DEFAULT NULL COMMENT '修改人',
                              PRIMARY KEY (`ID`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统配置 ';

-- ----------------------------
-- Records of sys_config
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for sys_dept
-- ----------------------------
DROP TABLE IF EXISTS `sys_dept`;
CREATE TABLE `sys_dept` (
                            `id` varchar(11) NOT NULL COMMENT '主键',
                            `name` varchar(50) DEFAULT NULL COMMENT '部门名称',
                            `address` varchar(200) DEFAULT NULL COMMENT '部门所在地',
                            `phone` varchar(50) DEFAULT NULL COMMENT '部门电话',
                            `dept_level` int DEFAULT NULL COMMENT '部门级别',
                            `sort` int DEFAULT NULL COMMENT '排序',
                            `dept_id` varchar(45) DEFAULT NULL COMMENT '上级部门id',
                            `tenant_id` varchar(45) DEFAULT NULL COMMENT '所属租户',
                            `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                            `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                            `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                            `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
                            `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
                            PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统部门';

-- ----------------------------
-- Records of sys_dept
-- ----------------------------
BEGIN;
INSERT INTO `sys_dept` VALUES ('1', '北京', NULL, NULL, NULL, NULL, '2', NULL, '0', '2019-08-27 10:38:59', '2019-11-01 10:23:20', '2', '2');
INSERT INTO `sys_dept` VALUES ('2', '中国', NULL, NULL, NULL, NULL, '0', NULL, '0', '2019-08-27 10:39:54', '2021-05-10 16:48:58', '2', '2');
INSERT INTO `sys_dept` VALUES ('3', '上海', '上海', '1111', 1, 2, '2', NULL, '0', '2020-09-11 12:17:08', NULL, '2', '2');
INSERT INTO `sys_dept` VALUES ('4', '美国', '1', '1', 1, 1, NULL, NULL, '0', '2020-09-22 14:43:59', NULL, '2', NULL);
INSERT INTO `sys_dept` VALUES ('5', '顺应', '北京', '111', 1, 3, '3', NULL, '0', '2021-04-21 11:24:50', NULL, '2', NULL);
COMMIT;

-- ----------------------------
-- Table structure for sys_dept_role
-- ----------------------------
DROP TABLE IF EXISTS `sys_dept_role`;
CREATE TABLE `sys_dept_role` (
                                 `id` varchar(45) NOT NULL COMMENT '主键',
                                 `dept_id` varchar(45) NOT NULL COMMENT '部门id',
                                 `role_id` varchar(45) NOT NULL COMMENT '角色id',
                                 `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                 `update_time` datetime DEFAULT NULL COMMENT '修改时间',
                                 `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
                                 `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
                                 PRIMARY KEY (`id`) USING BTREE,
                                 KEY `fk_sys_dept_has_sys_role_sys_role1_idx` (`role_id`) USING BTREE,
                                 KEY `fk_sys_dept_has_sys_role_sys_dept1_idx` (`dept_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统部门角色关系';

-- ----------------------------
-- Records of sys_dept_role
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for sys_dept_user
-- ----------------------------
DROP TABLE IF EXISTS `sys_dept_user`;
CREATE TABLE `sys_dept_user` (
                                 `id` varchar(45) NOT NULL COMMENT '主键',
                                 `user_id` varchar(45) NOT NULL COMMENT '用户id',
                                 `dept_id` varchar(45) NOT NULL COMMENT '部门id',
                                 `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                                 `update_time` datetime DEFAULT NULL COMMENT '修改时间',
                                 `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
                                 `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
                                 PRIMARY KEY (`id`) USING BTREE,
                                 KEY `fk_sys_user_has_sys_dept_sys_dept1_idx` (`dept_id`) USING BTREE,
                                 KEY `fk_sys_user_has_sys_dept_sys_user1_idx` (`user_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统用户部门关系';

-- ----------------------------
-- Records of sys_dept_user
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for sys_dict
-- ----------------------------
DROP TABLE IF EXISTS `sys_dict`;
CREATE TABLE `sys_dict` (
                            `id` varchar(45) NOT NULL COMMENT '主键',
                            `value` varchar(100) NOT NULL COMMENT '数据值',
                            `label` varchar(100) NOT NULL COMMENT '标签名',
                            `type` varchar(100) NOT NULL COMMENT '类型',
                            `description` varchar(100) NOT NULL COMMENT '描述',
                            `sort` int NOT NULL COMMENT '排序（升序）',
                            `remarks` varchar(255) DEFAULT NULL COMMENT '备注信息',
                            `tenant_id` varchar(45) NOT NULL DEFAULT '0' COMMENT '所属租户',
                            `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                            `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                            `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
                            `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
                            `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
                            PRIMARY KEY (`id`) USING BTREE,
                            KEY `sys_dict_value` (`value`) USING BTREE,
                            KEY `sys_dict_label` (`label`) USING BTREE,
                            KEY `sys_dict_del_flag` (`del_flag`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统字典';

-- ----------------------------
-- Records of sys_dict
-- ----------------------------
BEGIN;
INSERT INTO `sys_dict` VALUES ('1', '1', 'menu', 'flag_resource_status', '菜单', 1, '资源类型', '0', '0', '2019-09-12 16:39:25', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_dict` VALUES ('10', '_parent', 'parent', 'flag_html_target', '这个目标使得文档载入父窗口或者包含来超链接引用的框架的框架集', 3, NULL, '0', '0', '2020-09-23 16:05:08', '2020-09-23 16:05:08', '2', NULL);
INSERT INTO `sys_dict` VALUES ('11', '_top', 'top', 'flag_html_target', '用 _top 目标将会清除所有被包含的框架并将文档载入整个浏览器窗口', 4, NULL, '0', '0', '2020-09-23 16:06:49', '2020-09-23 16:06:48', '2', NULL);
INSERT INTO `sys_dict` VALUES ('12', '0', 'true', 'flag_bool', '是', 1, '系统逻辑字典', '0', '0', '2021-04-15 10:08:54', '2021-04-15 02:08:53', '2', NULL);
INSERT INTO `sys_dict` VALUES ('13', '1', 'false', 'flag_bool', '否', 2, '系统逻辑字典', '0', '0', '2021-04-15 10:18:41', '2021-04-15 02:18:40', '2', NULL);
INSERT INTO `sys_dict` VALUES ('14', '0', 'true', 'flag_switch', '开', 1, '系统开关字典', '0', '0', '2021-04-15 10:20:58', '2021-04-15 10:21:45', '2', '2');
INSERT INTO `sys_dict` VALUES ('15', '1', 'false', 'flag_switch', '关', 2, '系统开关字典', '0', '0', '2021-04-15 10:23:00', '2021-04-15 02:22:59', '2', NULL);
INSERT INTO `sys_dict` VALUES ('16', '0', 'GET', 'flag_request_method', 'GET', 0, '请求类型', '0', '0', '2021-04-25 08:27:14', '2021-04-25 08:31:40', '2', NULL);
INSERT INTO `sys_dict` VALUES ('17', '1', 'POST', 'flag_request_method', 'POST', 1, '请求类型', '0', '0', '2021-04-25 08:27:14', '2021-04-25 08:31:41', '2', NULL);
INSERT INTO `sys_dict` VALUES ('18', '2', 'PUT', 'flag_request_method', 'PUT', 2, '请求类型', '0', '0', '2021-04-25 08:27:14', '2021-04-25 08:31:42', '2', NULL);
INSERT INTO `sys_dict` VALUES ('19', '3', 'DELETE', 'flag_request_method', 'DELETE', 3, '请求类型', '0', '0', '2021-04-25 08:27:14', '2021-04-25 08:31:42', '2', NULL);
INSERT INTO `sys_dict` VALUES ('2', '2', 'operation', 'flag_resource_status', '操作', 2, '资源类型', '0', '0', '2019-09-12 16:39:51', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_dict` VALUES ('20', '0', '女', 'flag_gender', '女', 1, '性别', '0', '0', '2021-08-06 02:36:53', '2021-08-06 02:36:53', NULL, NULL);
INSERT INTO `sys_dict` VALUES ('21', '1', '男', 'flag_gender', '男', 2, '性别', '0', '0', '2021-08-06 02:37:34', '2021-08-06 02:37:34', NULL, NULL);
INSERT INTO `sys_dict` VALUES ('22', '0', 'ERD', 'flag_project_group', '所属项目分组', 0, '项目分组', '0', '0', '2022-11-06 09:45:14', '2022-11-06 09:45:53', '2', NULL);
INSERT INTO `sys_dict` VALUES ('3', '3', 'file', 'flag_resource_status', '文件', 3, '资源类型', '0', '0', '2019-09-12 16:40:38', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_dict` VALUES ('4', '4', 'element', 'flag_resource_status', '页面元素', 4, '资源类型', '0', '0', '2019-09-12 16:40:59', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_dict` VALUES ('5', '1', 'uat', 'flag_dev_status', '演示环境', 1, '当前系统环境', '0', '0', '2020-07-24 16:12:36', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_dict` VALUES ('6', '0', 'pro', 'flag_dev_status', '正式环境', 0, '当前系统环境', '0', '0', '2020-07-24 16:25:13', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_dict` VALUES ('7', '2', 'none', 'flag_dev_status', '不区分环境', 2, '当前系统环境', '0', '0', '2020-07-24 16:31:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_dict` VALUES ('8', '_blank', 'blank', 'flag_html_target', '浏览器总在一个新打开、未命名的窗口中载入目标文档', 1, NULL, '0', '0', '2020-09-23 16:01:49', '2020-09-23 16:14:29', '2', '2');
INSERT INTO `sys_dict` VALUES ('9', '_self', 'self', 'flag_html_target', '这个目标的值对所有没有指定目标的 <a> 标签是默认目标', 1, NULL, '0', '0', '2020-09-23 16:04:07', '2020-09-23 16:04:07', '2', NULL);
COMMIT;

-- ----------------------------
-- Table structure for sys_element
-- ----------------------------
DROP TABLE IF EXISTS `sys_element`;
CREATE TABLE `sys_element` (
                               `id` varchar(45) NOT NULL COMMENT '主键',
                               `name` varchar(32) NOT NULL COMMENT '页面元素名称',
                               `authority` varchar(32) NOT NULL COMMENT '权限编码',
                               `flag_request_method` varchar(45) DEFAULT NULL COMMENT '请求类型',
                               `url` varchar(250) DEFAULT NULL COMMENT '页面元素路径',
                               `sort` int DEFAULT '1' COMMENT '排序值',
                               `tenant_id` varchar(45) NOT NULL DEFAULT '0' COMMENT '所属租户',
                               `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                               `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                               `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                               `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
                               `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
                               PRIMARY KEY (`id`) USING BTREE,
                               UNIQUE KEY `code_UNIQUE` (`authority`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统页面元素';

-- ----------------------------
-- Records of sys_element
-- ----------------------------
BEGIN;
INSERT INTO `sys_element` VALUES ('3', '个人VIP', 'ele_person_vip', NULL, '', 1, '0', '0', '2021-07-12 15:53:27', NULL, '2', NULL);
INSERT INTO `sys_element` VALUES ('4', '企业VIP', 'ele_enterprise_vip', NULL, '', 1, '0', '0', '2021-07-12 15:54:17', NULL, '2', NULL);
COMMIT;

-- ----------------------------
-- Table structure for sys_file
-- ----------------------------
DROP TABLE IF EXISTS `sys_file`;
CREATE TABLE `sys_file` (
                            `id` varchar(45) NOT NULL COMMENT '主键',
                            `name` varchar(32) NOT NULL COMMENT '文件名称',
                            `authority` varchar(32) NOT NULL COMMENT '权限编码',
                            `flag_request_method` int DEFAULT NULL COMMENT '请求类型',
                            `url` varchar(250) DEFAULT NULL COMMENT '文件路径',
                            `sort` int DEFAULT '1' COMMENT '排序值',
                            `tenant_id` varchar(45) NOT NULL DEFAULT '0' COMMENT '所属租户',
                            `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                            `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                            `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                            `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
                            `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
                            PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统文件';

-- ----------------------------
-- Records of sys_file
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for sys_log
-- ----------------------------
DROP TABLE IF EXISTS `sys_log`;
CREATE TABLE `sys_log` (
                           `id` varchar(45) NOT NULL COMMENT '主键',
                           `type` int DEFAULT NULL COMMENT '日志状态',
                           `title` varchar(255) DEFAULT '' COMMENT '日志标题',
                           `remote_addr` varchar(255) DEFAULT NULL COMMENT '操作IP地址',
                           `user_agent` varchar(1000) DEFAULT NULL COMMENT '用户代理',
                           `request_uri` varchar(255) DEFAULT NULL COMMENT '请求URI',
                           `method` varchar(10) DEFAULT NULL COMMENT '操作方式',
                           `params` text COMMENT '操作提交的数据',
                           `body` varchar(4000) DEFAULT NULL COMMENT '请求body体',
                           `time` bigint DEFAULT NULL COMMENT '执行时间(ms)',
                           `exception` text COMMENT '异常信息',
                           `tenant_id` varchar(45) DEFAULT '0' COMMENT '所属租户',
                           `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
                           `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
                           `update_time` datetime DEFAULT NULL COMMENT '更新时间',
                           `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
                           `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
                           PRIMARY KEY (`id`) USING BTREE,
                           KEY `sys_log_type` (`type`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统日志';



-- ----------------------------
-- Table structure for sys_menu
-- ----------------------------
DROP TABLE IF EXISTS `sys_menu`;
CREATE TABLE `sys_menu` (
  `id` varchar(45) NOT NULL COMMENT '主键',
  `name` varchar(32) NOT NULL COMMENT '菜单名称',
  `authority` varchar(50) NOT NULL COMMENT '权限编码',
  `flag_project_group` varchar(45) DEFAULT NULL COMMENT '所属项目分组',
  `flag_request_method` varchar(45) DEFAULT NULL COMMENT '请求类型',
  `url` varchar(250) DEFAULT NULL COMMENT '后端权限url',
  `path` varchar(128) DEFAULT NULL COMMENT '前端URL',
  `target` varchar(50) DEFAULT '_blank' COMMENT '重定向操作',
  `table_name` varchar(50) DEFAULT NULL COMMENT '绑定表名',
  `menu_id` varchar(45) DEFAULT NULL COMMENT '父菜单ID',
  `icon` varchar(32) DEFAULT NULL COMMENT '图标',
  `locale` varchar(45) DEFAULT NULL COMMENT '国际化字段',
  `parent_key` varchar(200) DEFAULT NULL COMMENT '父菜单路径',
  `ui_key` varchar(100) DEFAULT NULL COMMENT '任意值',
  `component` varchar(64) DEFAULT NULL COMMENT '前端组件',
  `sort` int DEFAULT '1' COMMENT '排序值',
  `hide_in_menu` bit(1) DEFAULT b'0' COMMENT '是否隐藏菜单',
  `hide_children_in_menu` bit(1) DEFAULT b'0' COMMENT '是否隐藏子菜单',
  `dev` bit(1) NOT NULL DEFAULT b'0' COMMENT '是否为演示数据',
  `flag_is_gent_operation` bit(1) DEFAULT b'0' COMMENT '是否已生成按钮',
  `tenant_id` varchar(45) NOT NULL DEFAULT '0' COMMENT '所属租户',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
  `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_authority` (`authority`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统菜单';

-- ----------------------------
-- Records of sys_menu
-- ----------------------------
BEGIN;
INSERT INTO `sys_menu` VALUES ('100024597134442508', '首页', 'erd_project_home', '22', NULL, NULL, '/project/home', '', NULL, '196', 'icon-gongzuotaishouye', 'menu.dashboard', NULL, NULL, NULL, 1, b'0', b'0', b'0', b'0', '0', '0', '2022-10-29 13:17:59', NULL, '2', NULL);
INSERT INTO `sys_menu` VALUES ('100024597134442509', '最近项目', 'erd_project_recent', '22', NULL, NULL, '/project/recent', '', NULL, '196', 'icon-gongzuotaishouye', 'menu.dashboard', NULL, NULL, NULL, 1, b'0', b'0', b'0', b'0', '0', '0', '2022-10-29 13:17:59', NULL, '2', NULL);
INSERT INTO `sys_menu` VALUES ('100024597134442510', '个人项目', 'erd_project_person', '22', NULL, NULL, '/project/person', '', NULL, '196', 'icon-gongzuotaishouye', 'menu.dashboard', NULL, NULL, NULL, 1, b'0', b'0', b'0', b'0', '0', '0', '2022-10-29 13:17:59', NULL, '2', NULL);
INSERT INTO `sys_menu` VALUES ('100024597134442511', '团队基础设置', 'erd_project_group', '22', NULL, NULL, '/project/group', '', NULL, '196', 'icon-gongzuotaishouye', 'menu.dashboard', NULL, NULL, NULL, 1, b'0', b'0', b'0', b'0', '0', '0', '2022-10-29 13:17:59', NULL, '2', NULL);
INSERT INTO `sys_menu` VALUES ('100024597134442512', '团队权限组', 'erd_project_group_setting', '22', NULL, NULL, '/project/group/setting', '', NULL, '196', 'icon-gongzuotaishouye', 'menu.dashboard', NULL, NULL, NULL, 1, b'0', b'0', b'0', b'0', '0', '0', '2022-10-29 13:17:59', NULL, '2', NULL);
INSERT INTO `sys_menu` VALUES ('100024597134442513', '模型设计', 'erd_design_table_model', '22', NULL, NULL, '/design/table/model', '', NULL, '196', 'icon-gongzuotaishouye', 'menu.dashboard', NULL, NULL, NULL, 1, b'0', b'0', b'0', b'0', '0', '0', '2022-10-29 13:17:59', NULL, '2', NULL);
INSERT INTO `sys_menu` VALUES ('100024597134442514', '版本管理', 'erd_design_table_version_all', '22', NULL, NULL, '/design/table/version/all', '', NULL, '196', 'icon-gongzuotaishouye', 'menu.dashboard', NULL, NULL, NULL, 1, b'0', b'0', b'0', b'0', '0', '0', '2022-10-29 13:17:59', NULL, '2', NULL);
INSERT INTO `sys_menu` VALUES ('100024597134442515', '导入', 'erd_design_import', '22', NULL, NULL, '/design/import', '', NULL, '196', 'icon-gongzuotaishouye', 'menu.dashboard', NULL, NULL, NULL, 1, b'0', b'0', b'0', b'0', '0', '0', '2022-10-29 13:17:59', NULL, '2', NULL);
INSERT INTO `sys_menu` VALUES ('100024597134442516', '解析PdMan', 'erd_design_import_component_ReversePdMan', '22', NULL, NULL, '/design/import/component/ReversePdMan', '', NULL, '196', 'icon-gongzuotaishouye', 'menu.dashboard', NULL, NULL, NULL, 1, b'0', b'0', b'0', b'0', '0', '0', '2022-10-29 13:17:59', NULL, '2', NULL);
INSERT INTO `sys_menu` VALUES ('100024597134442517', '解析ERD', 'erd_design_import_component_ReverseERD', '22', NULL, NULL, '/design/import/component/ReverseERD', '', NULL, '196', 'icon-gongzuotaishouye', 'menu.dashboard', NULL, NULL, NULL, 1, b'0', b'0', b'0', b'0', '0', '0', '2022-10-29 13:17:59', NULL, '2', NULL);
INSERT INTO `sys_menu` VALUES ('100024597134442518', '导出', 'erd_design_export', '22', NULL, NULL, '/design/export', '', NULL, '196', 'icon-gongzuotaishouye', 'menu.dashboard', NULL, NULL, NULL, 1, b'0', b'0', b'0', b'0', '0', '0', '2022-10-29 13:17:59', NULL, '2', NULL);
INSERT INTO `sys_menu` VALUES ('100024597134442519', '高级导出', 'erd_design_export_component_ExportDDL', '22', NULL, NULL, '/design/export/component/ExportDDL', '', NULL, '196', 'icon-gongzuotaishouye', 'menu.dashboard', NULL, NULL, NULL, 1, b'0', b'0', b'0', b'0', '0', '0', '2022-10-29 13:17:59', NULL, '2', NULL);
INSERT INTO `sys_menu` VALUES ('100024597134442520', '设置', 'erd_design_setting', '22', NULL, NULL, '/design/setting', '', NULL, '196', 'icon-gongzuotaishouye', 'menu.dashboard', NULL, NULL, NULL, 1, b'0', b'0', b'0', b'0', '0', '0', '2022-10-29 13:17:59', NULL, '2', NULL);
INSERT INTO `sys_menu` VALUES ('100024597134442521', '默认字段设置', 'erd_design_setting_component_DefaultField', '22', NULL, NULL, '/design/setting/component/DefaultField', '', NULL, '196', 'icon-gongzuotaishouye', 'menu.dashboard', NULL, NULL, NULL, 1, b'0', b'0', b'0', b'0', '0', '0', '2022-10-29 13:17:59', NULL, '2', NULL);
INSERT INTO `sys_menu` VALUES ('100024597134442522', '系统默认项设置', 'erd_design_setting_component_DefaultSetUp', '22', NULL, NULL, '/design/setting/component/DefaultSetUp', '', NULL, '196', 'icon-gongzuotaishouye', 'menu.dashboard', NULL, NULL, NULL, 1, b'0', b'0', b'0', b'0', '0', '0', '2022-10-29 13:17:59', NULL, '2', NULL);
INSERT INTO `sys_menu` VALUES ('134', 'Dashboard', 'dashboard', NULL, NULL, NULL, '/dashboard', NULL, NULL, '0', 'icon-gongzuotaishouye', 'menu.dashboard', NULL, NULL, NULL, 1, b'0', b'0', b'0', b'0', '0', '0', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('135', '首页', 'dashboard-analysis', NULL, NULL, NULL, '/dashboard/analysis', NULL, NULL, '134', 'icon-yunyingfenxi', 'menu.home', NULL, NULL, NULL, 2, b'0', b'0', b'0', b'0', '0', '0', '2020-07-23 19:41:33', '2020-09-27 10:17:22', '2', '2');
INSERT INTO `sys_menu` VALUES ('136', '监控页', 'dashboard-monitor', NULL, NULL, NULL, '/dashboard/monitor', NULL, NULL, '134', 'icon-jiankong', 'menu.dashboard.monitor', NULL, NULL, NULL, 3, b'0', b'0', b'0', b'0', '0', '0', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('137', '工作台', 'dashboard-workplace', NULL, NULL, NULL, '/dashboard/workplace', NULL, NULL, '134', 'icon-gongzuotaishouye', 'menu.dashboard.workplace', NULL, NULL, NULL, 4, b'0', b'0', b'0', b'0', '0', '0', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('138', '表单页', 'form', NULL, NULL, NULL, '/form', NULL, NULL, '0', 'form', 'menu.form', NULL, NULL, NULL, 1, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('139', '基础表单', 'form-basic-form', NULL, NULL, NULL, '/form/basic-form', NULL, NULL, '138', 'smile', 'menu.form.basic-form', NULL, NULL, NULL, 6, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', '2020-09-10 11:33:54', '2', '2');
INSERT INTO `sys_menu` VALUES ('140', '分步表单', 'form-step-form', NULL, NULL, NULL, '/form/step-form', NULL, NULL, '138', 'smile', 'menu.form.step-form', NULL, NULL, NULL, 7, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('141', '高级表单', 'form-advanced-form', NULL, NULL, NULL, '/form/advanced-form', NULL, NULL, '138', 'smile', 'menu.form.advanced-form', NULL, NULL, NULL, 8, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('142', '列表页', 'list', NULL, NULL, NULL, '/list', NULL, NULL, '0', 'table', 'menu.list', NULL, NULL, NULL, 5, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('143', '搜索列表', 'list-search', NULL, NULL, NULL, '/list/search', NULL, NULL, '142', 'smile', 'menu.list.search-list', NULL, NULL, NULL, 10, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('144', '搜索列表（文章）', 'list-search-articles', NULL, NULL, NULL, '/list/search/articles', NULL, NULL, '142', 'smile', 'menu.list.search-list.articles', NULL, NULL, NULL, 11, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('145', '搜索列表（项目）', 'list-search-projects', NULL, NULL, NULL, '/list/search/projects', NULL, NULL, '142', 'smile', 'menu.list.search-list.projects', NULL, NULL, NULL, 12, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('146', '搜索列表（应用）', 'list-search-applications', NULL, NULL, NULL, '/list/search/applications', NULL, NULL, '142', 'smile', 'menu.list.search-list.applications', NULL, NULL, NULL, 13, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('147', '查询表格', 'list-table-list', NULL, NULL, NULL, '/list/table-list', NULL, NULL, '142', 'smile', 'menu.list.table-list', NULL, NULL, NULL, 14, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('148', '标准列表', 'list-basic-list', NULL, NULL, NULL, '/list/basic-list', NULL, NULL, '142', 'smile', 'menu.list.basic-list', NULL, NULL, NULL, 15, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('149', '卡片列表', 'list-card-list', NULL, NULL, NULL, '/list/card-list', NULL, NULL, '142', 'smile', 'menu.list.card-list', NULL, NULL, NULL, 16, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('150', '详情页', 'profile', NULL, NULL, NULL, '/profile', NULL, NULL, '0', 'profile', 'menu.profile', NULL, NULL, NULL, 17, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('151', '基础详情页', 'profile- basic', NULL, NULL, NULL, '/profile/basic', NULL, NULL, '150', 'smile', 'menu.profile.basic', NULL, NULL, NULL, 18, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('152', '高级详情页', 'profile-advanced', NULL, NULL, NULL, '/profile/advanced', NULL, NULL, '150', 'smile', 'menu.profile.advanced', NULL, NULL, NULL, 19, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('153', '结果页', 'result', NULL, NULL, NULL, '/result', NULL, NULL, '0', 'check-circle-o', 'menu.result', NULL, NULL, NULL, 9, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('154', '成功页', 'result-success', NULL, NULL, NULL, '/result/success', NULL, NULL, '153', 'smile', 'menu.result.success', NULL, NULL, NULL, 21, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('155', '失败页', 'result-fail', NULL, NULL, NULL, '/result/fail', NULL, NULL, '153', 'smile', 'menu.result.fail', NULL, NULL, NULL, 22, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('156', '异常页', 'exception', NULL, NULL, NULL, '/exception', NULL, NULL, '0', 'warning', 'menu.exception', NULL, NULL, NULL, 20, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('157', '403', 'exception-403', NULL, NULL, NULL, '/exception/403', NULL, NULL, '156', 'smile', 'menu.exception.403', NULL, NULL, NULL, 24, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('158', '404', 'exception-404', NULL, NULL, NULL, '/exception/404', NULL, NULL, '156', 'smile', 'menu.exception.404', NULL, NULL, NULL, 25, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('159', '500', 'exception-500', NULL, NULL, NULL, '/exception/500', NULL, NULL, '156', 'smile', 'menu.exception.500', NULL, NULL, NULL, 26, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('160', '站点', 'site', NULL, NULL, NULL, '/site', NULL, NULL, '0', 'user', 'menu.site', NULL, NULL, NULL, 23, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('161', '站点配置', 'site-site-config', NULL, NULL, NULL, '/site/site-config', NULL, NULL, '160', 'smile', 'menu.site.site-config', NULL, NULL, NULL, 28, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('162', '个人页', 'account', NULL, NULL, NULL, '/account', NULL, NULL, '0', 'icon-yonghuguanli', 'menu.account', NULL, NULL, NULL, 56, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('163', '个人中心', 'account-center', NULL, NULL, NULL, '/account/center', NULL, NULL, '162', 'smile', 'menu.account.center', NULL, NULL, NULL, 30, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('164', '个人设置', 'account-settings', NULL, NULL, NULL, '/account/settings', NULL, NULL, '162', 'icon-shezhi', 'menu.account.settings', NULL, NULL, NULL, 31, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('165', '图形编辑器', 'editor', NULL, NULL, NULL, '/editor', NULL, NULL, '0', 'highlight', 'menu.editor', NULL, NULL, NULL, 27, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('166', '流程编辑器', 'editor-flow', NULL, NULL, NULL, '/editor/flow', NULL, NULL, '165', 'smile', 'menu.editor.flow', NULL, NULL, NULL, 33, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('167', '脑图编辑器', 'editor-mind', NULL, NULL, NULL, '/editor/mind', NULL, NULL, '165', 'smile', 'menu.editor.mind', NULL, NULL, NULL, 34, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('168', '拓扑编辑器', 'editor-koni', NULL, NULL, NULL, '/editor/koni', NULL, NULL, '165', 'smile', 'menu.editor.koni', NULL, NULL, NULL, 45, b'0', b'0', b'0', b'0', '0', '1', '2020-07-23 19:41:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('169', '系统管理', 'system', NULL, NULL, NULL, '/system', NULL, NULL, '0', 'icon-xitongguanli', 'menu.system', NULL, NULL, NULL, 29, b'0', b'0', b'0', b'0', '0', '0', '2020-07-27 14:15:55', '2020-09-11 15:50:31', '2', '2');
INSERT INTO `sys_menu` VALUES ('170', '用户管理', 'system-user', NULL, NULL, NULL, '/system/user', NULL, NULL, '169', 'icon-yonghuguanli', 'menu.system.user', NULL, NULL, NULL, 37, b'0', b'0', b'0', b'0', '0', '0', '2020-07-27 14:45:25', '2020-09-11 15:48:12', '2', '2');
INSERT INTO `sys_menu` VALUES ('172', '角色管理', 'system-role', NULL, NULL, NULL, '/system/role', NULL, NULL, '169', 'icon-jiaoseguanli', 'menu.system.role', NULL, NULL, '', 38, b'0', b'0', b'0', b'0', '0', '0', '2020-08-14 14:45:56', '2020-09-11 15:49:08', '2', '2');
INSERT INTO `sys_menu` VALUES ('173', '字典管理', 'system-dict', NULL, NULL, NULL, '/system/dict', NULL, NULL, '169', 'icon-zidianpeizhi', 'menu.system.dict', NULL, NULL, NULL, 46, b'0', b'0', b'0', b'0', '0', '0', '2020-09-08 11:56:01', '2020-09-11 15:49:37', '2', '2');
INSERT INTO `sys_menu` VALUES ('174', '文件管理', 'system-file', NULL, NULL, NULL, '/system/file', NULL, NULL, '169', 'icon-xiaoyanguizeguanli', 'menu.system.file', NULL, NULL, NULL, 45, b'0', b'0', b'0', b'0', '0', '0', '2020-09-08 16:13:31', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('175', '操作日志管理', 'system-log', NULL, NULL, NULL, '/system/log', NULL, NULL, '169', 'icon-caozuorizhi', 'menu.system.log', NULL, NULL, NULL, 42, b'0', b'0', b'0', b'0', '0', '0', '2020-09-08 16:14:28', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('176', '配置管理', 'system-config', NULL, NULL, NULL, '/system/config', NULL, NULL, '169', 'icon-peizhi', 'menu.system.config', NULL, NULL, NULL, 44, b'0', b'0', b'0', b'0', '0', '0', '2020-09-08 16:15:33', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('177', '页面元素管理', 'system-element', NULL, NULL, NULL, '/system/element', NULL, NULL, '169', 'icon-shuxingguanli', 'menu.system.element', NULL, NULL, NULL, 43, b'0', b'0', b'0', b'0', '0', '0', '2020-09-08 16:16:29', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('178', '菜单管理', 'system_menu', NULL, NULL, NULL, '/system/menu', NULL, NULL, '169', 'icon-caidanguanli', 'menu.system.menu', NULL, NULL, NULL, 40, b'0', b'0', b'0', b'0', '0', '0', '2020-09-09 17:37:44', NULL, '2', '2');
INSERT INTO `sys_menu` VALUES ('181', '按钮管理', 'system-operation', NULL, NULL, NULL, '/system/operation', NULL, NULL, '169', 'icon-anniuguanli', 'menu.system.operation', NULL, NULL, NULL, 41, b'0', b'0', b'0', b'0', '0', '0', '2020-09-10 13:54:10', '2020-09-10 13:54:22', '2', '2');
INSERT INTO `sys_menu` VALUES ('182', '部门管理', 'system-dept', NULL, NULL, NULL, '/system/dept', NULL, NULL, '169', 'icon-zuzhijigou1', 'menu.system.dept', NULL, NULL, NULL, 39, b'0', b'0', b'0', b'0', '0', '0', '2020-09-11 11:43:11', '2020-09-11 11:43:32', '2', '2');
INSERT INTO `sys_menu` VALUES ('183', '开发管理', 'development', NULL, NULL, NULL, '/development', NULL, NULL, NULL, 'icon-gongzuotaishouye', 'menu.development', NULL, NULL, NULL, 32, b'0', b'0', b'0', b'0', '0', '0', '2020-09-15 10:15:40', '2021-03-18 18:40:46', '2', '2');
INSERT INTO `sys_menu` VALUES ('184', '代码生成', 'development-code', NULL, NULL, NULL, '/development/code', '_target', 'sys_code', '183', 'icon-shengchengbaobiao', 'menu.development.code', NULL, NULL, NULL, 47, b'0', b'0', b'0', b'0', '0', '0', '2020-09-15 10:16:21', '2021-03-18 18:42:20', '2', '2');
INSERT INTO `sys_menu` VALUES ('185', '打开百度', 'development-baidu', NULL, NULL, NULL, '/development/baidu', NULL, NULL, '183', 'smile', 'menu.development.baidu', NULL, NULL, '', 48, b'0', b'0', b'0', b'0', '0', '1', '2020-09-22 17:38:01', '2020-09-24 12:19:50', '2', '2');
INSERT INTO `sys_menu` VALUES ('186', '系统监控', 'monitor', NULL, NULL, NULL, '/monitor', '_blank', NULL, NULL, 'icon-wangluoanquanshebeijiankong', 'menu.monitor', NULL, NULL, NULL, 36, b'0', b'0', b'0', b'0', '0', '0', '2020-09-24 17:15:37', '2021-03-18 18:38:12', '2', '2');
INSERT INTO `sys_menu` VALUES ('187', '服务监控', 'monitor-monitor', NULL, NULL, NULL, '/monitor/monitor', '_blank', NULL, '186', 'icon-quanqudaofuwujiankong', 'menu.monitor.admin', NULL, NULL, NULL, 50, b'0', b'0', b'0', b'0', '0', '0', '2020-09-24 17:16:45', '2021-03-19 20:13:03', '2', '2');
INSERT INTO `sys_menu` VALUES ('188', '接口管理', 'development-swagger', NULL, NULL, NULL, '/development/swagger', '_blank', NULL, '183', 'icon-APIguanli', 'menu.development.swagger', NULL, NULL, NULL, 51, b'0', b'0', b'0', b'0', '0', '0', '2020-09-25 12:21:39', '2021-03-18 18:41:33', '2', '2');
INSERT INTO `sys_menu` VALUES ('189', '服务链路追踪', 'monitor-trace', NULL, NULL, NULL, '/monitor/trace', '_blank', NULL, '186', 'icon-lianlu', 'menu.monitor.trace', NULL, NULL, NULL, 53, b'0', b'0', b'0', b'0', '0', '0', '2020-09-25 15:49:14', '2021-03-19 20:13:56', '2', '2');
INSERT INTO `sys_menu` VALUES ('190', 'Redis监控', 'monitor-redis', NULL, NULL, NULL, '/monitor/redis', '_blank', NULL, '186', 'icon-redis', 'menu.monitor.redis', NULL, NULL, NULL, 52, b'0', b'0', b'0', b'0', '0', '0', '2020-09-28 16:24:01', '2021-03-19 20:13:30', '2', '2');
INSERT INTO `sys_menu` VALUES ('191', 'Sentinel流控管理', 'monitor-sentinel', NULL, NULL, NULL, '/monitor/sentinel', '_blank', NULL, '186', 'icon-flow-01', 'menu.monitor.sentinel', NULL, NULL, NULL, 54, b'0', b'0', b'0', b'0', '0', '0', '2020-10-14 10:31:28', '2021-03-19 20:13:43', '2', '2');
INSERT INTO `sys_menu` VALUES ('192', 'Nacos配置管理', 'monitor-nacos', NULL, NULL, NULL, '/monitor/nacos', '_blank', NULL, '186', 'icon-yonghupeizhi', 'menu.monitor.nacos', NULL, NULL, NULL, 55, b'0', b'0', b'0', b'0', '0', '0', '2020-10-14 10:41:09', '2021-03-19 20:13:15', '2', '2');
INSERT INTO `sys_menu` VALUES ('193', '任务调度', 'quartz', NULL, NULL, NULL, '/quartz', '_blank', NULL, NULL, 'icon-renwuguanli', 'menu.quartz', NULL, NULL, NULL, 49, b'0', b'0', b'0', b'0', '0', '0', '2021-03-18 15:21:49', '2021-03-19 19:24:58', '2', '2');
INSERT INTO `sys_menu` VALUES ('194', '调度记录', 'QRTZ_HISTORY_page', NULL, NULL, NULL, '/quartz/history', '_blank', 'QRTZ_HISTORY', '193', 'icon-rizhiguanli', 'menu.quartz.qrtzHistory', NULL, NULL, NULL, 58, b'0', b'0', b'0', b'0', '0', '0', '2021-03-18 15:23:01', '2021-03-18 18:36:42', '2', '2');
INSERT INTO `sys_menu` VALUES ('195', '任务管理', 'quartz_quartz', NULL, NULL, NULL, '/quartz/quartz', '_blank', 'QRTZ_JOB_DETAILS', '193', 'icon-wangluotiaodushitu', 'menu.quartz.quartz', NULL, NULL, NULL, 57, b'0', b'0', b'0', b'0', '0', '0', '2021-03-18 17:13:41', '2021-03-18 18:39:52', '2', '2');
INSERT INTO `sys_menu` VALUES ('196', 'ERD权限管理', 'erd', '22', NULL, NULL, '/dashboard1', '_blank', NULL, NULL, 'icon-gongzuotaishouye', 'menu.dashboard', NULL, NULL, NULL, 1, b'0', b'0', b'0', b'0', '0', '0', '2021-05-13 10:20:42', NULL, '2', NULL);
COMMIT;

-- ----------------------------
-- Table structure for sys_operation
-- ----------------------------
DROP TABLE IF EXISTS `sys_operation`;
CREATE TABLE `sys_operation` (
  `id` varchar(45) NOT NULL COMMENT '主键',
  `name` varchar(32) NOT NULL COMMENT '操作名称',
  `authority` varchar(64) DEFAULT NULL COMMENT '权限编码',
  `flag_request_method` varchar(45) DEFAULT NULL COMMENT '请求类型',
  `url` varchar(250) DEFAULT NULL COMMENT '后端权限url',
  `parent_id` varchar(45) DEFAULT NULL COMMENT '父操作id',
  `menu_id` varchar(45) DEFAULT NULL COMMENT '所属菜单',
  `icon` varchar(32) DEFAULT NULL COMMENT '图标',
  `component` varchar(64) DEFAULT NULL COMMENT '前端组件',
  `sort` int DEFAULT '1' COMMENT '排序值',
  `tenant_id` varchar(45) NOT NULL DEFAULT '0' COMMENT '所属租户',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
  `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `code_UNIQUE` (`authority`) USING BTREE,
  KEY `sys_operation_menu_id_index` (`menu_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统操作';

-- ----------------------------
-- Records of sys_operation
-- ----------------------------
BEGIN;
INSERT INTO `sys_operation` VALUES ('10', '新增', 'sys_dept_add', '17', '/dept', '0', '182', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100', '查询系统菜单', 'sys_menu_tree', NULL, NULL, '0', '172', NULL, NULL, 1, '0', '0', '2019-10-30 15:47:46', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100024597134442529', '项目查询', 'erd_project_page', '16', '/project/page', '0', NULL, NULL, NULL, 1, '0', '0', '2022-10-29 14:33:13', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234518', '查看页面', 'erd_project_home', '16', '/project/home', '0', '100024597134442508', NULL, NULL, 1, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234519', '查看页面', 'erd_project_recent_page', '16', '/project/recent/page', '0', '100024597134442509', NULL, NULL, 1, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234520', '搜索', 'erd_project_recent_page_search', '16', '/project/recent/page', '0', '100024597134442509', NULL, NULL, 1, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234521', '修改', 'erd_project_recent_edit', '18', '/project/recent', '0', '100024597134442509', NULL, NULL, 1, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234522', '删除', 'erd_project_recent_del', '19', '/project/recent', '0', '100024597134442509', NULL, NULL, 1, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234523', '查看页面', 'erd_project_person_page', '16', '/project/person/page', '0', '100024597134442510', NULL, NULL, 1, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234524', '搜索', 'erd_project_person_page_search', '16', '/project/person/page', '0', '100024597134442510', NULL, NULL, 1, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234525', '新增', 'erd_project_person_add', '17', '/project/person', '0', '100024597134442510', NULL, NULL, 1, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234526', '修改', 'erd_project_person_edit', '18', '/project/person', '0', '100024597134442510', NULL, NULL, 1, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234527', '删除', 'erd_project_person_del', '19', '/project/person', '0', '100024597134442510', NULL, NULL, 1, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234528', '查看页面', 'erd_project_group_page', '16', '/project/group/page', '0', '100024597134442511', NULL, NULL, 1, '0', '1', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234529', '搜索', 'erd_project_group_page_search', '16', '/project/group/page', '0', '100024597134442511', NULL, NULL, 2, '0', '1', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234530', '新增', 'erd_project_group_add', '17', '/project/group', '0', '100024597134442511', NULL, NULL, 3, '0', '1', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234531', '修改', 'erd_project_group_edit', '18', '/project/group', '0', '100024597134442511', NULL, NULL, 4, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234532', '删除', 'erd_project_group_del', '19', '/project/group', '0', '100024597134442511', NULL, NULL, 5, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234533', '用户组成员', 'erd_project_roles_page', '16', '/project/roles', '0', '100024597134442512', NULL, NULL, 1, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234534', '搜索', 'erd_project_roles_search', '16', '/project/roles', '0', '100024597134442512', NULL, NULL, 2, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234535', '新增用户', 'erd_project_users_add', '17', '/project/users', '0', '100024597134442512', NULL, NULL, 3, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234536', '移除用户', 'erd_project_role_users_del', '19', '/project/role/users', '0', '100024597134442512', NULL, NULL, 4, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234537', '权限配置', 'erd_project_role_permission', '16', '/project/role/permission', '0', '100024597134442512', NULL, NULL, 5, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234538', '修改权限', 'erd_project_role_permission_edit', '17', '/project/role/permission', '0', '100024597134442512', NULL, NULL, 6, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234539', '查看页面', 'erd_project_info', '16', '/project/info', '0', '100024597134442513', NULL, NULL, 1, '0', '1', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234540', '修改模型', 'erd_project_save', '16', '/project/save', '0', '100024597134442513', NULL, NULL, 2, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234541', '查看页面', 'erd_hisProject_load', '16', '/hisProject/load', '0', '100024597134442514', NULL, NULL, 1, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234542', '全部版本', 'erd_hisProject_all', '16', '/hisProject/load', '0', '100024597134442514', NULL, NULL, 2, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234543', '获取数据源版本', 'erd_connector_dbversion', '16', '/connector/dbversion', '0', '100024597134442514', NULL, NULL, 3, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234544', '新增', 'erd_hisProject_add', '17', '/hisProject', '0', '100024597134442514', NULL, NULL, 4, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234545', '同步配置', 'erd_hisProject_config', '17', '/hisProject/config', '0', '100024597134442514', NULL, NULL, 5, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234546', '初始化基线', 'erd_hisProject_init', '17', '/hisProject/init', '0', '100024597134442514', NULL, NULL, 6, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234547', '重建基线', 'erd_hisProject_rebuild', '17', '/hisProject/rebuild', '0', '100024597134442514', NULL, NULL, 7, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234548', '编辑', 'erd_hisProject_edit', '18', '/hisProject', '0', '100024597134442514', NULL, NULL, 8, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234549', '删除', 'erd_hisProject_del', '19', '/hisProject', '0', '100024597134442514', NULL, NULL, 9, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234550', '同步数据源', 'erd_connector_dbsync', '17', '/connector/dbsync', '0', '100024597134442514', NULL, NULL, 10, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234551', '查看页面', 'erd_table_import', '16', '/table/import', '0', '100024597134442515', NULL, NULL, 1, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234552', '逆向解析', 'erd_connector_dbReverseParse', '16', '/connector/dbReverseParse', '0', '100024597134442515', NULL, NULL, 2, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234553', 'PDMan', 'erd_table_import_pdman', '16', '/table/import/pdman', '0', '100024597134442515', NULL, NULL, 3, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234554', 'ERD', 'erd_table_import_erd', '16', '/table/import/erd', '0', '100024597134442515', NULL, NULL, 4, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234555', '查看页面', 'erd_table_export', '16', '/table/export', '0', '100024597134442518', NULL, NULL, 1, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234556', '普通导出', 'erd_table_export_common', '16', '/table/export/common', '0', '100024597134442518', NULL, NULL, 2, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234557', '高级导出', 'erd_table_export_more', '16', '/table/export/more', '0', '100024597134442518', NULL, NULL, 3, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234558', '查看页面', 'erd_table_setting', '16', '/table/setting', '0', '100024597134442520', NULL, NULL, 1, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234559', '数据源', 'erd_table_setting_db', '16', '/table/setting/db', '0', '100024597134442520', NULL, NULL, 2, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234560', '默认字段', 'erd_table_setting_defaultField', '16', '/table/setting/defaultField', '0', '100024597134442520', NULL, NULL, 3, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234561', '系统默认项', 'erd_table_setting_default', '16', '/table/setting/default', '0', '100024597134442520', NULL, NULL, 4, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234562', '下载Word模板', 'erd_doc_downloadWordTemplate', '16', '/doc/downloadWordTemplate', '0', '100024597134442520', NULL, NULL, 5, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234563', '上传Word模板', 'erd_doc_uploadWordTemplate', '17', '/doc/uploadWordTemplate', '0', '100024597134442520', NULL, NULL, 6, '0', '0', '2022-11-05 04:26:16', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('100030513200234673', '查看页面', 'erd_project_permission_group', '16', '/project/group/setting/permission', '0', '100024597134442512', NULL, NULL, 0, '0', '0', '2022-11-11 03:02:48', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('101', '新增', 'sys_config_add', '17', '/config', '0', '176', NULL, NULL, 1, '0', '0', '2020-07-24 17:16:48', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('102', '删除', 'sys_config_del', '19', '/config', '0', '176', NULL, NULL, 1, '0', '0', '2020-07-24 17:16:48', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('103', '修改', 'sys_config_edit', '18', '/config', '0', '176', NULL, NULL, 1, '0', '0', '2020-07-24 17:16:48', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('104', '查询', 'sys_config_get', '16', '/config', '0', '176', NULL, NULL, 1, '0', '0', '2020-07-24 17:16:48', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('105', '分页', 'sys_config_page', '16', '/config/page', '0', '176', NULL, NULL, 1, '0', '0', '2020-07-24 17:16:48', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('106', '批量删除', 'sys_config_deleteBatch', '19', '/config', '0', '176', NULL, NULL, 1, '0', '0', '2020-07-24 17:16:48', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('107', 'test', NULL, NULL, NULL, NULL, '170', NULL, NULL, 2, '0', '1', '2020-09-11 11:05:21', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('109', '新增', 'sys_code_add', '17', '/code', NULL, '184', NULL, NULL, 1, '0', '0', '2020-09-15 14:52:49', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('11', '删除', 'sys_dept_del', '19', '/dept', '0', '182', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('110', '删除', 'sys_code_del', '19', '/code', NULL, '184', NULL, NULL, 1, '0', '0', '2020-09-15 14:52:49', '2020-09-16 14:00:45', '2', '2');
INSERT INTO `sys_operation` VALUES ('111', '修改', 'sys_code_edit', '18', '/code', NULL, '184', NULL, NULL, 1, '0', '0', '2020-09-15 14:52:49', '2020-09-16 14:00:56', '2', '2');
INSERT INTO `sys_operation` VALUES ('112', '查询', 'sys_code_get', '16', '/code', NULL, '184', NULL, NULL, 1, '0', '0', '2020-09-15 14:52:49', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('113', '分页', 'sys_code_page', '16', '/code/page', NULL, '184', NULL, NULL, 1, '0', '0', '2020-09-15 14:52:49', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('114', '批量删除', 'sys_code_deleteBatch', '19', '/code', NULL, '184', NULL, NULL, 1, '0', '0', '2020-09-15 14:52:49', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('115', '1', '1111', NULL, NULL, NULL, NULL, '11', '11', 11, '0', '0', '2020-09-22 14:45:16', NULL, '2', NULL);
INSERT INTO `sys_operation` VALUES ('116', '新增', 'QRTZ_HISTORY_add', '17', NULL, NULL, '194', NULL, NULL, 1, '0', '0', '2021-03-18 16:07:51', NULL, '2', NULL);
INSERT INTO `sys_operation` VALUES ('117', '删除', 'QRTZ_HISTORY_del', '19', NULL, NULL, '194', NULL, NULL, 1, '0', '0', '2021-03-18 16:07:51', NULL, '2', NULL);
INSERT INTO `sys_operation` VALUES ('118', '修改', 'QRTZ_HISTORY_edit', '18', NULL, NULL, '194', NULL, NULL, 1, '0', '0', '2021-03-18 16:07:51', NULL, '2', NULL);
INSERT INTO `sys_operation` VALUES ('119', '查询', 'QRTZ_HISTORY_get', '16', NULL, NULL, '194', NULL, NULL, 1, '0', '0', '2021-03-18 16:07:51', NULL, '2', NULL);
INSERT INTO `sys_operation` VALUES ('12', '修改', 'sys_dept_edit', '18', '/dept', '0', '182', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('120', '分页', 'QRTZ_HISTORY_page', '16', NULL, NULL, '194', NULL, NULL, 1, '0', '0', '2021-03-18 16:07:51', NULL, '2', NULL);
INSERT INTO `sys_operation` VALUES ('121', '批量删除', 'QRTZ_HISTORY_deleteBatch', '19', NULL, NULL, '194', NULL, NULL, 1, '0', '0', '2021-03-18 16:07:51', NULL, '2', NULL);
INSERT INTO `sys_operation` VALUES ('122', '新增', 'QRTZ_JOB_DETAILS_add', '17', NULL, NULL, '195', NULL, NULL, 1, '0', '0', '2021-03-18 17:14:44', NULL, '2', NULL);
INSERT INTO `sys_operation` VALUES ('123', '删除', 'QRTZ_JOB_DETAILS_del', '19', NULL, NULL, '195', NULL, NULL, 1, '0', '0', '2021-03-18 17:14:44', NULL, '2', NULL);
INSERT INTO `sys_operation` VALUES ('124', '修改', 'QRTZ_JOB_DETAILS_edit', '18', NULL, NULL, '195', NULL, NULL, 1, '0', '0', '2021-03-18 17:14:44', NULL, '2', NULL);
INSERT INTO `sys_operation` VALUES ('125', '查询', 'QRTZ_JOB_DETAILS_get', '16', NULL, NULL, '195', NULL, NULL, 1, '0', '0', '2021-03-18 17:14:44', NULL, '2', NULL);
INSERT INTO `sys_operation` VALUES ('126', '分页', 'QRTZ_JOB_DETAILS_page', '16', NULL, NULL, '195', NULL, NULL, 1, '0', '0', '2021-03-18 17:14:44', NULL, '2', NULL);
INSERT INTO `sys_operation` VALUES ('127', '批量删除', 'QRTZ_JOB_DETAILS_deleteBatch', '19', NULL, NULL, '195', NULL, NULL, 1, '0', '0', '2021-03-18 17:14:44', NULL, '2', NULL);
INSERT INTO `sys_operation` VALUES ('128', '代码生成', 'sys_code_generate', '17', '/code/generateCode', NULL, '184', NULL, NULL, 1, '0', '0', '2021-04-25 15:40:21', NULL, '2', NULL);
INSERT INTO `sys_operation` VALUES ('129', '查询角色菜单', 'sys_role_getAllMenuByRole', '16', '/role/getAllMenuByRole', NULL, '172', NULL, NULL, 1, '0', '0', '2021-05-08 09:08:21', NULL, '2', NULL);
INSERT INTO `sys_operation` VALUES ('13', '查询', 'sys_dept_get', '16', '/dept', '0', '182', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('131', '分页查询按钮', 'sys_operation_unionPage', '16', '/operation/unionPage', NULL, '181', NULL, NULL, 1, '0', '0', '2021-05-08 09:48:25', NULL, '2', NULL);
INSERT INTO `sys_operation` VALUES ('132', '查询角色按钮', 'sys_role_getOperationByCheckedMenus', '16', '/role/getOperationByCheckedMenus', NULL, '172', NULL, NULL, 1, '0', '0', '2021-05-08 10:06:43', NULL, '2', NULL);
INSERT INTO `sys_operation` VALUES ('133', '分页查询菜单', 'sys_menu_unionPage', '16', '/menu/unionPage', NULL, '178', NULL, NULL, 1, '0', '0', '2021-05-10 06:56:59', NULL, NULL, NULL);
INSERT INTO `sys_operation` VALUES ('135', '分页查询部门', 'sys_dept_unionPage', '16', '/dept/unionPage', NULL, '182', NULL, NULL, 1, '0', '0', '2021-05-10 06:58:28', NULL, NULL, NULL);
INSERT INTO `sys_operation` VALUES ('138', '保存角色菜单', 'sys_role_saveCheckedMenus', '17', '/role/saveCheckedMenus', '1', '172', NULL, NULL, 1, '0', '0', '2021-05-10 07:15:10', '2021-07-18 17:07:33', NULL, '2');
INSERT INTO `sys_operation` VALUES ('139', '查询所有角色', 'sys_user_getAllRoles', '16', '/user/getAllRoles', '0', '170', NULL, NULL, 1, '0', '0', '2021-07-18 14:27:07', NULL, '2', NULL);
INSERT INTO `sys_operation` VALUES ('14', '分页', 'sys_dept_page', '16', '/dept/page', '0', '182', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('140', '保存角色按钮', 'sys_role_saveCheckedOperations', '17', '/role/saveCheckedOperations', '1', '172', NULL, NULL, 1, '0', '0', '2021-07-18 17:09:43', NULL, '2', NULL);
INSERT INTO `sys_operation` VALUES ('141', '用户分配角色', 'sys_user_addUserRole', '17', '/user/addUserRole', '0', '170', NULL, NULL, 1, '0', '0', '2021-07-18 17:34:07', NULL, '2', NULL);
INSERT INTO `sys_operation` VALUES ('142', '用户删除角色', 'sys_user_deleteUserRole', '17', '/user/deleteUserRole', '0', '170', NULL, NULL, 1, '0', '0', '2021-07-18 18:05:23', NULL, '2', NULL);
INSERT INTO `sys_operation` VALUES ('15', '批量删除', 'sys_dept_deleteBatch', '19', '/dept', '0', '182', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('16', '新增', 'sys_dept_role_add', '17', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('17', '删除', 'sys_dept_role_del', '19', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('18', '修改', 'sys_dept_role_edit', '18', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('19', '查询', 'sys_dept_role_get', '16', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('20', '分页', 'sys_dept_role_page', '16', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('21', '批量删除', 'sys_dept_role_deleteBatch', '19', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('22', '新增', 'sys_dept_user_add', '17', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('23', '删除', 'sys_dept_user_del', '19', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('24', '修改', 'sys_dept_user_edit', '18', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('25', '查询', 'sys_dept_user_get', '16', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('26', '分页', 'sys_dept_user_page', '16', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('27', '批量删除', 'sys_dept_user_deleteBatch', '19', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('28', '新增', 'sys_dict_add', '17', '/dict', '0', '173', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('29', '删除', 'sys_dict_del', '19', '/dict', '0', '173', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('30', '修改', 'sys_dict_edit', '18', '/dict', '0', '173', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('31', '查询', 'sys_dict_get', '16', '/dict', '0', '173', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('32', '分页', 'sys_dict_page', '16', '/dict/page', '0', '173', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('33', '批量删除', 'sys_dict_deleteBatch', '19', '/dict', '0', '173', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('34', '新增', 'sys_element_add', '17', '/element', '0', '177', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('35', '删除', 'sys_element_del', '19', '/element', '0', '177', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('36', '修改', 'sys_element_edit', '18', '/element', '0', '177', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('37', '查询', 'sys_element_get', '16', '/element', '0', '177', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('38', '分页', 'sys_element_page', '16', '/element/page', '0', '177', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('39', '批量删除', 'sys_element_deleteBatch', '19', '/element', '0', '177', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('40', '新增', 'sys_file_add', '17', '/file', '0', '174', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('41', '删除', 'sys_file_del', '19', '/file', '0', '174', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('42', '修改', 'sys_file_edit', '18', '/file', '0', '174', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('43', '查询', 'sys_file_get', '16', '/file', '0', '174', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('44', '分页', 'sys_file_page', '16', '/file/page', '0', '174', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('45', '批量删除', 'sys_file_deleteBatch', '19', '/file', '0', '174', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('46', '新增', 'sys_log_add', '17', '/log', '0', '175', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('47', '删除', 'sys_log_del', '19', '/log', '0', '175', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('48', '修改', 'sys_log_edit', '18', '/log', '0', '175', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('49', '查询', 'sys_log_get', '16', '/log', '0', '175', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('50', '分页', 'sys_log_page', '16', '/log/page', '0', '175', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('51', '批量删除', 'sys_log_deleteBatch', '19', '/log', '0', '175', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('52', '新增', 'sys_menu_add', '17', '/menu', '0', '178', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('53', '删除', 'sys_menu_del', '19', '/menu', '0', '178', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('54', '修改', 'sys_menu_edit', '18', '/menu', '0', '178', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('55', '查询', 'sys_menu_get', '16', '/menu', '0', '178', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('56', '分页', 'sys_menu_page', '16', '/menu/page', '0', '178', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('57', '批量删除', 'sys_menu_deleteBatch', '19', '/menu', '0', '178', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('58', '新增', 'sys_operation_add', '17', '/operation', '0', '181', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('59', '删除', 'sys_operation_del', '19', '/operation', '0', '181', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('60', '修改', 'sys_operation_edit', '18', '/operation', '0', '181', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('61', '查询', 'sys_operation_get', '16', '/operation', '0', '181', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('62', '分页', 'sys_operation_page', '16', '/operation/page', '0', '181', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('63', '批量删除', 'sys_operation_deleteBatch', '19', '/operation', '0', '181', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('64', '新增', 'sys_privilege_add', '17', '/privilege', '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('65', '删除', 'sys_privilege_del', '19', '/privilege', '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('66', '修改', 'sys_privilege_edit', '18', '/privilege', '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:38', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('67', '查询', 'sys_privilege_get', '16', '/privilege', '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('68', '分页', 'sys_privilege_page', '16', '/privilege/page', '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('69', '批量删除', 'sys_privilege_deleteBatch', '19', '/privilege', '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('70', '新增', 'sys_role_add', '17', '/role', '0', '172', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('71', '删除', 'sys_role_del', '19', '/role', '0', '172', NULL, NULL, 2, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('72', '修改', 'sys_role_edit', '18', '/role', '0', '172', NULL, NULL, 3, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('73', '查询', 'sys_role_get', '16', '/role', '0', '172', NULL, NULL, 4, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('74', '分页', 'sys_role_page', '16', '/role/page', '0', '172', NULL, NULL, 5, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('75', '批量删除', 'sys_role_deleteBatch', '19', '/role', '0', '172', NULL, NULL, 6, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('76', '新增', 'sys_role_privilege_add', '17', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('77', '删除', 'sys_role_privilege_del', '19', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('78', '修改', 'sys_role_privilege_edit', '18', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('79', '查询', 'sys_role_privilege_get', '16', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('80', '分页', 'sys_role_privilege_page', '16', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('81', '批量删除', 'sys_role_privilege_deleteBatch', '19', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('82', '新增', 'sys_social_details_add', '17', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('83', '删除', 'sys_social_details_del', '19', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('84', '修改', 'sys_social_details_edit', '18', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('85', '查询', 'sys_social_details_get', '16', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('86', '分页', 'sys_social_details_page', '16', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('87', '批量删除', 'sys_social_details_deleteBatch', '19', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('88', '新增', 'sys_user_add', '17', '/user', '0', '170', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('89', '删除', 'sys_user_del', '19', '/user', '0', '170', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('90', '修改', 'sys_user_edit', '18', '/user', '0', '170', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('91', '查询', 'sys_user_get', '16', '/user', '0', '170', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('92', '分页', 'sys_user_page', '16', '/user/page', '0', '170', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('93', '批量删除', 'sys_user_deleteBatch', '19', '/user', '0', '170', NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('94', '新增', 'sys_user_role_add', '17', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('95', '删除', 'sys_user_role_del', '19', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('96', '修改', 'sys_user_role_edit', '18', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('97', '查询', 'sys_user_role_get', '16', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('98', '分页', 'sys_user_role_page', '16', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
INSERT INTO `sys_operation` VALUES ('99', '批量删除', 'sys_user_role_deleteBatch', '19', NULL, '0', NULL, NULL, NULL, 1, '0', '0', '2019-10-30 15:45:39', NULL, '2', '2');
COMMIT;

-- ----------------------------
-- Table structure for sys_privilege
-- ----------------------------
DROP TABLE IF EXISTS `sys_privilege`;
CREATE TABLE `sys_privilege` (
  `id` varchar(45) NOT NULL COMMENT '主键',
  `type` varchar(50) NOT NULL COMMENT '权限类型',
  `resource_id` varchar(45) NOT NULL COMMENT '资源id',
  `role_id` varchar(45) NOT NULL COMMENT '角色id',
  `dict_id` varchar(45) NOT NULL COMMENT '权限类型',
  `tenant_id` varchar(45) NOT NULL DEFAULT '0' COMMENT '所属租户',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
  `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `sys_dict_del_flag` (`del_flag`) USING BTREE,
  KEY `fk_sys_privilege_sys_dict1_idx` (`dict_id`) USING BTREE,
  KEY `sys_privilege_role_id_index` (`role_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统权限';

-- ----------------------------
-- Records of sys_privilege
-- ----------------------------
BEGIN;
INSERT INTO `sys_privilege` VALUES ('100024597134442528', '1', '100024597134442508', '100024597134442524', '1', '0', '0', '2022-10-29 14:18:25', '2022-10-29 14:19:00', '2', '2');
INSERT INTO `sys_privilege` VALUES ('100024597134442530', '2', '100024597134442529', '100024597134442524', '2', '0', '0', '2022-10-29 14:35:49', '2022-10-29 14:50:29', '2', '2');
INSERT INTO `sys_privilege` VALUES ('100030513200234779', '2', '100030513200234555', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234780', '2', '100030513200234556', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234781', '2', '100030513200234557', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234782', '2', '100030513200234551', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234783', '2', '100030513200234552', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234784', '2', '100030513200234553', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234785', '2', '100030513200234554', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234786', '2', '100030513200234558', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234787', '2', '100030513200234559', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234788', '2', '100030513200234560', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234789', '2', '100030513200234561', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234790', '2', '100030513200234562', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234791', '2', '100030513200234563', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234792', '2', '100030513200234539', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234793', '2', '100030513200234540', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234794', '2', '100030513200234541', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234795', '2', '100030513200234542', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234796', '2', '100030513200234543', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234797', '2', '100030513200234544', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234798', '2', '100030513200234545', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234799', '2', '100030513200234546', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234800', '2', '100030513200234547', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234801', '2', '100030513200234548', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234802', '2', '100030513200234549', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234803', '2', '100030513200234550', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234804', '2', '100030513200234528', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234805', '2', '100030513200234531', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234806', '2', '100030513200234532', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234807', '2', '100030513200234533', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234808', '2', '100030513200234534', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234809', '2', '100030513200234535', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234810', '2', '100030513200234536', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234811', '2', '100030513200234537', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234812', '2', '100030513200234538', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234813', '2', '100030513200234673', '100030513200234564', '2', '0', '0', '2022-11-11 03:21:51', '2022-11-11 03:21:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234814', '2', '100030513200234555', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234815', '2', '100030513200234556', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234816', '2', '100030513200234557', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234817', '2', '100030513200234551', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234818', '2', '100030513200234552', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234819', '2', '100030513200234553', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234820', '2', '100030513200234554', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234821', '2', '100030513200234558', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234822', '2', '100030513200234559', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234823', '2', '100030513200234560', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234824', '2', '100030513200234561', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234825', '2', '100030513200234562', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234826', '2', '100030513200234563', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234827', '2', '100030513200234539', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234828', '2', '100030513200234540', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234829', '2', '100030513200234541', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234830', '2', '100030513200234542', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234831', '2', '100030513200234543', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234832', '2', '100030513200234544', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234833', '2', '100030513200234545', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234834', '2', '100030513200234546', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234835', '2', '100030513200234547', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234836', '2', '100030513200234548', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234837', '2', '100030513200234549', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234838', '2', '100030513200234550', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234839', '2', '100030513200234528', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234840', '2', '100030513200234531', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234841', '2', '100030513200234533', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234842', '2', '100030513200234534', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234843', '2', '100030513200234535', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234844', '2', '100030513200234536', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234845', '2', '100030513200234537', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234846', '2', '100030513200234538', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234847', '2', '100030513200234673', '100030513200234565', '2', '0', '0', '2022-11-11 03:21:59', '2022-11-11 03:21:59', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234871', '2', '100030513200234555', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234872', '2', '100030513200234556', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234873', '2', '100030513200234557', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234874', '2', '100030513200234551', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234875', '2', '100030513200234552', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234876', '2', '100030513200234553', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234877', '2', '100030513200234554', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234878', '2', '100030513200234558', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234879', '2', '100030513200234559', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234880', '2', '100030513200234560', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234881', '2', '100030513200234561', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234882', '2', '100030513200234562', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234883', '2', '100030513200234563', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234884', '2', '100030513200234539', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234885', '2', '100030513200234540', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234886', '2', '100030513200234541', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234887', '2', '100030513200234542', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234888', '2', '100030513200234543', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234889', '2', '100030513200234544', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234890', '2', '100030513200234545', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234891', '2', '100030513200234546', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234892', '2', '100030513200234547', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234893', '2', '100030513200234548', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234894', '2', '100030513200234549', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234895', '2', '100030513200234550', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234896', '2', '100030513200234528', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234897', '2', '100030513200234531', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234898', '2', '100030513200234532', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234899', '2', '100030513200234533', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234900', '2', '100030513200234534', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234901', '2', '100030513200234535', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234902', '2', '100030513200234536', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234903', '2', '100030513200234537', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234904', '2', '100030513200234538', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234905', '2', '100030513200234673', '1f709d16b5070a02ccfa657f5342afbd', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234906', '2', '100030513200234555', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234907', '2', '100030513200234556', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234908', '2', '100030513200234557', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234909', '2', '100030513200234551', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234910', '2', '100030513200234552', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234911', '2', '100030513200234553', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234912', '2', '100030513200234554', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234913', '2', '100030513200234558', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234914', '2', '100030513200234559', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234915', '2', '100030513200234560', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234916', '2', '100030513200234561', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234917', '2', '100030513200234562', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234918', '2', '100030513200234563', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234919', '2', '100030513200234539', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234920', '2', '100030513200234540', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234921', '2', '100030513200234541', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234922', '2', '100030513200234542', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234923', '2', '100030513200234543', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234924', '2', '100030513200234544', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234925', '2', '100030513200234545', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234926', '2', '100030513200234546', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234927', '2', '100030513200234547', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234928', '2', '100030513200234548', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234929', '2', '100030513200234549', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234930', '2', '100030513200234550', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234931', '2', '100030513200234528', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234932', '2', '100030513200234531', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234933', '2', '100030513200234533', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234934', '2', '100030513200234534', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234935', '2', '100030513200234535', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234936', '2', '100030513200234536', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234937', '2', '100030513200234537', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234938', '2', '100030513200234538', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234939', '2', '100030513200234673', 'f9275f1342d6f983e9f56a02f5676797', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234940', '2', '100030513200234555', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234941', '2', '100030513200234556', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234942', '2', '100030513200234557', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234943', '2', '100030513200234551', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234944', '2', '100030513200234552', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234945', '2', '100030513200234553', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234946', '2', '100030513200234554', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234947', '2', '100030513200234558', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234948', '2', '100030513200234560', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234949', '2', '100030513200234561', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234950', '2', '100030513200234562', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234951', '2', '100030513200234563', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234952', '2', '100030513200234539', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234953', '2', '100030513200234540', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234954', '2', '100030513200234541', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234955', '2', '100030513200234542', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234956', '2', '100030513200234543', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234957', '2', '100030513200234544', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234958', '2', '100030513200234545', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234959', '2', '100030513200234548', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234960', '2', '100030513200234549', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234961', '2', '100030513200234528', 'd2295a3f67461444b311d874e23bb82a', '2', '0', '0', '2022-11-11 04:54:06', '2022-11-11 04:54:06', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234963', '2', '100030513200234555', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234964', '2', '100030513200234556', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234965', '2', '100030513200234557', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234966', '2', '100030513200234551', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234967', '2', '100030513200234552', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234968', '2', '100030513200234553', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234969', '2', '100030513200234554', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234970', '2', '100030513200234558', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234971', '2', '100030513200234559', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234972', '2', '100030513200234560', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234973', '2', '100030513200234561', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234974', '2', '100030513200234562', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234975', '2', '100030513200234563', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234976', '2', '100030513200234539', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234977', '2', '100030513200234540', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234978', '2', '100030513200234541', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234979', '2', '100030513200234542', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234980', '2', '100030513200234543', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234981', '2', '100030513200234544', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234982', '2', '100030513200234545', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234983', '2', '100030513200234546', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234984', '2', '100030513200234547', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234985', '2', '100030513200234548', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234986', '2', '100030513200234549', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234987', '2', '100030513200234550', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234988', '2', '100030513200234528', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234989', '2', '100030513200234531', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234990', '2', '100030513200234532', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234991', '2', '100030513200234533', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234992', '2', '100030513200234534', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234993', '2', '100030513200234535', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234994', '2', '100030513200234536', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234995', '2', '100030513200234537', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234996', '2', '100030513200234538', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234997', '2', '100030513200234673', '56e52e62cbb6e9574cba7d54139c45f2', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234998', '2', '100030513200234555', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200234999', '2', '100030513200234556', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235000', '2', '100030513200234557', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235001', '2', '100030513200234551', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235002', '2', '100030513200234552', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235003', '2', '100030513200234553', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235004', '2', '100030513200234554', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235005', '2', '100030513200234558', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235006', '2', '100030513200234559', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235007', '2', '100030513200234560', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235008', '2', '100030513200234561', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235009', '2', '100030513200234562', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235010', '2', '100030513200234563', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235011', '2', '100030513200234539', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235012', '2', '100030513200234540', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235013', '2', '100030513200234541', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235014', '2', '100030513200234542', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235015', '2', '100030513200234543', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235016', '2', '100030513200234544', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235017', '2', '100030513200234545', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235018', '2', '100030513200234546', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235019', '2', '100030513200234547', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235020', '2', '100030513200234548', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235021', '2', '100030513200234549', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235022', '2', '100030513200234550', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235023', '2', '100030513200234528', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235024', '2', '100030513200234531', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235025', '2', '100030513200234533', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235026', '2', '100030513200234534', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235027', '2', '100030513200234535', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235028', '2', '100030513200234536', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235029', '2', '100030513200234537', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235030', '2', '100030513200234538', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235031', '2', '100030513200234673', 'b561695689e7947ab578009f9bbc1660', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235032', '2', '100030513200234555', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235033', '2', '100030513200234556', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235034', '2', '100030513200234557', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235035', '2', '100030513200234551', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235036', '2', '100030513200234552', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235037', '2', '100030513200234553', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235038', '2', '100030513200234554', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235039', '2', '100030513200234558', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235040', '2', '100030513200234560', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235041', '2', '100030513200234561', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235042', '2', '100030513200234562', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235043', '2', '100030513200234563', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235044', '2', '100030513200234539', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235045', '2', '100030513200234540', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235046', '2', '100030513200234541', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235047', '2', '100030513200234542', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235048', '2', '100030513200234543', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235049', '2', '100030513200234544', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235050', '2', '100030513200234545', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235051', '2', '100030513200234548', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235052', '2', '100030513200234549', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235053', '2', '100030513200234528', '13632a44215002316b1c5f38466a952d', '2', '0', '0', '2022-11-11 06:52:08', '2022-11-11 06:52:08', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235054', '2', '100030513200234555', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235055', '2', '100030513200234556', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235056', '2', '100030513200234557', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235057', '2', '100030513200234551', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235058', '2', '100030513200234552', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235059', '2', '100030513200234553', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235060', '2', '100030513200234554', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235061', '2', '100030513200234558', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235062', '2', '100030513200234559', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235063', '2', '100030513200234560', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235064', '2', '100030513200234561', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235065', '2', '100030513200234562', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235066', '2', '100030513200234563', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235067', '2', '100030513200234539', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235068', '2', '100030513200234540', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235069', '2', '100030513200234541', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235070', '2', '100030513200234542', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235071', '2', '100030513200234543', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235072', '2', '100030513200234544', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235073', '2', '100030513200234545', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235074', '2', '100030513200234546', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235075', '2', '100030513200234547', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235076', '2', '100030513200234548', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235077', '2', '100030513200234549', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235078', '2', '100030513200234550', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235079', '2', '100030513200234528', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235080', '2', '100030513200234531', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235081', '2', '100030513200234532', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235082', '2', '100030513200234533', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235083', '2', '100030513200234534', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235084', '2', '100030513200234535', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235085', '2', '100030513200234536', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235086', '2', '100030513200234537', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235087', '2', '100030513200234538', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235088', '2', '100030513200234673', 'db0719b8ff3eec1077f5f04aecc7aa57', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235089', '2', '100030513200234555', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235090', '2', '100030513200234556', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235091', '2', '100030513200234557', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235092', '2', '100030513200234551', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235093', '2', '100030513200234552', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235094', '2', '100030513200234553', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235095', '2', '100030513200234554', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235096', '2', '100030513200234558', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235097', '2', '100030513200234559', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235098', '2', '100030513200234560', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235099', '2', '100030513200234561', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235100', '2', '100030513200234562', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235101', '2', '100030513200234563', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235102', '2', '100030513200234539', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235103', '2', '100030513200234540', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235104', '2', '100030513200234541', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235105', '2', '100030513200234542', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235106', '2', '100030513200234543', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235107', '2', '100030513200234544', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235108', '2', '100030513200234545', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235109', '2', '100030513200234546', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235110', '2', '100030513200234547', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235111', '2', '100030513200234548', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235112', '2', '100030513200234549', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235113', '2', '100030513200234550', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235114', '2', '100030513200234528', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235115', '2', '100030513200234531', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235116', '2', '100030513200234533', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235117', '2', '100030513200234534', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235118', '2', '100030513200234535', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235119', '2', '100030513200234536', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235120', '2', '100030513200234537', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235121', '2', '100030513200234538', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235122', '2', '100030513200234673', '7323946064ab208bf80107912442609b', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235123', '2', '100030513200234555', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235124', '2', '100030513200234556', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235125', '2', '100030513200234557', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235126', '2', '100030513200234551', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235127', '2', '100030513200234552', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235128', '2', '100030513200234553', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235129', '2', '100030513200234554', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235130', '2', '100030513200234558', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235131', '2', '100030513200234560', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235132', '2', '100030513200234561', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235133', '2', '100030513200234562', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235134', '2', '100030513200234563', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235135', '2', '100030513200234539', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235136', '2', '100030513200234540', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235137', '2', '100030513200234541', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235138', '2', '100030513200234542', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235139', '2', '100030513200234543', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235140', '2', '100030513200234544', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235141', '2', '100030513200234545', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235142', '2', '100030513200234548', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235143', '2', '100030513200234549', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235144', '2', '100030513200234528', 'f3a61e2e70be99ed3abbf4a9aa259f7e', '2', '0', '0', '2022-11-11 12:45:02', '2022-11-11 12:45:02', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235146', '2', '100030513200234555', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235147', '2', '100030513200234556', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235148', '2', '100030513200234557', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235149', '2', '100030513200234551', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235150', '2', '100030513200234552', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235151', '2', '100030513200234553', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235152', '2', '100030513200234554', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235153', '2', '100030513200234558', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235154', '2', '100030513200234559', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235155', '2', '100030513200234560', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235156', '2', '100030513200234561', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235157', '2', '100030513200234562', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235158', '2', '100030513200234563', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235159', '2', '100030513200234539', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235160', '2', '100030513200234540', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235161', '2', '100030513200234541', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235162', '2', '100030513200234542', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235163', '2', '100030513200234543', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235164', '2', '100030513200234544', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235165', '2', '100030513200234545', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235166', '2', '100030513200234546', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235167', '2', '100030513200234547', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235168', '2', '100030513200234548', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235169', '2', '100030513200234549', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235170', '2', '100030513200234550', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235171', '2', '100030513200234528', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235172', '2', '100030513200234531', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235173', '2', '100030513200234532', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235174', '2', '100030513200234533', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235175', '2', '100030513200234534', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235176', '2', '100030513200234535', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235177', '2', '100030513200234536', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235178', '2', '100030513200234537', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235179', '2', '100030513200234538', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235180', '2', '100030513200234673', '65f689074ea14bc86db02f9fb897d6cf', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235181', '2', '100030513200234555', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235182', '2', '100030513200234556', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235183', '2', '100030513200234557', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235184', '2', '100030513200234551', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235185', '2', '100030513200234552', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235186', '2', '100030513200234553', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235187', '2', '100030513200234554', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235188', '2', '100030513200234558', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235189', '2', '100030513200234559', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235190', '2', '100030513200234560', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235191', '2', '100030513200234561', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235192', '2', '100030513200234562', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235193', '2', '100030513200234563', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235194', '2', '100030513200234539', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235195', '2', '100030513200234540', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235196', '2', '100030513200234541', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235197', '2', '100030513200234542', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235198', '2', '100030513200234543', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235199', '2', '100030513200234544', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235200', '2', '100030513200234545', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235201', '2', '100030513200234546', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235202', '2', '100030513200234547', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235203', '2', '100030513200234548', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235204', '2', '100030513200234549', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235205', '2', '100030513200234550', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235206', '2', '100030513200234528', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235207', '2', '100030513200234531', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235208', '2', '100030513200234533', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235209', '2', '100030513200234534', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235210', '2', '100030513200234535', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235211', '2', '100030513200234536', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235212', '2', '100030513200234537', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235213', '2', '100030513200234538', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235214', '2', '100030513200234673', '67a6a46efdd81d9127f0ba9d4b689713', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235215', '2', '100030513200234555', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235216', '2', '100030513200234556', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235217', '2', '100030513200234557', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235218', '2', '100030513200234551', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235219', '2', '100030513200234552', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235220', '2', '100030513200234553', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235221', '2', '100030513200234554', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235222', '2', '100030513200234558', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235223', '2', '100030513200234560', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235224', '2', '100030513200234561', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235225', '2', '100030513200234562', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235226', '2', '100030513200234563', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235227', '2', '100030513200234539', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235228', '2', '100030513200234540', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235229', '2', '100030513200234541', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235230', '2', '100030513200234542', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235231', '2', '100030513200234543', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235232', '2', '100030513200234544', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235233', '2', '100030513200234545', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235234', '2', '100030513200234548', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235235', '2', '100030513200234549', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235236', '2', '100030513200234528', '1ee00bd4f06953422d303d59929325e0', '2', '0', '0', '2022-11-11 12:46:51', '2022-11-11 12:46:51', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235238', '2', '100030513200234555', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235239', '2', '100030513200234556', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235240', '2', '100030513200234557', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235241', '2', '100030513200234551', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235242', '2', '100030513200234552', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235243', '2', '100030513200234553', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235244', '2', '100030513200234554', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235245', '2', '100030513200234558', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235246', '2', '100030513200234559', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235247', '2', '100030513200234560', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235248', '2', '100030513200234561', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235249', '2', '100030513200234562', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235250', '2', '100030513200234563', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235251', '2', '100030513200234539', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235252', '2', '100030513200234540', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235253', '2', '100030513200234541', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235254', '2', '100030513200234542', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235255', '2', '100030513200234543', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235256', '2', '100030513200234544', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235257', '2', '100030513200234545', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235258', '2', '100030513200234546', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235259', '2', '100030513200234547', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235260', '2', '100030513200234548', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235261', '2', '100030513200234549', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235262', '2', '100030513200234550', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235263', '2', '100030513200234528', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235264', '2', '100030513200234531', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235265', '2', '100030513200234532', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235266', '2', '100030513200234533', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235267', '2', '100030513200234534', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235268', '2', '100030513200234535', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235269', '2', '100030513200234536', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235270', '2', '100030513200234537', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235271', '2', '100030513200234538', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235272', '2', '100030513200234673', '00e9a957636db103cbb027f80dcb5ede', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235273', '2', '100030513200234555', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235274', '2', '100030513200234556', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235275', '2', '100030513200234557', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235276', '2', '100030513200234551', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235277', '2', '100030513200234552', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235278', '2', '100030513200234553', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235279', '2', '100030513200234554', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235280', '2', '100030513200234558', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235281', '2', '100030513200234559', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235282', '2', '100030513200234560', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235283', '2', '100030513200234561', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235284', '2', '100030513200234562', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235285', '2', '100030513200234563', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235286', '2', '100030513200234539', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235287', '2', '100030513200234540', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235288', '2', '100030513200234541', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235289', '2', '100030513200234542', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235290', '2', '100030513200234543', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235291', '2', '100030513200234544', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235292', '2', '100030513200234545', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235293', '2', '100030513200234546', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235294', '2', '100030513200234547', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235295', '2', '100030513200234548', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235296', '2', '100030513200234549', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235297', '2', '100030513200234550', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235298', '2', '100030513200234528', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235299', '2', '100030513200234531', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235300', '2', '100030513200234533', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235301', '2', '100030513200234534', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235302', '2', '100030513200234535', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235303', '2', '100030513200234536', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235304', '2', '100030513200234537', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235305', '2', '100030513200234538', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235306', '2', '100030513200234673', 'caeb786684442ea62204532067e395b3', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235307', '2', '100030513200234555', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235308', '2', '100030513200234556', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235309', '2', '100030513200234557', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235310', '2', '100030513200234551', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235311', '2', '100030513200234552', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235312', '2', '100030513200234553', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235313', '2', '100030513200234554', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235314', '2', '100030513200234558', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235315', '2', '100030513200234560', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235316', '2', '100030513200234561', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235317', '2', '100030513200234562', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235318', '2', '100030513200234563', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235319', '2', '100030513200234539', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235320', '2', '100030513200234540', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235321', '2', '100030513200234541', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235322', '2', '100030513200234542', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235323', '2', '100030513200234543', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235324', '2', '100030513200234544', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235325', '2', '100030513200234545', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235326', '2', '100030513200234548', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235327', '2', '100030513200234549', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235328', '2', '100030513200234528', '600b9da4f1c9eb4b0780abef220c3248', '2', '0', '0', '2022-11-11 12:47:16', '2022-11-11 12:47:16', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235337', '2', '100030513200234555', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235338', '2', '100030513200234556', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235339', '2', '100030513200234557', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235340', '2', '100030513200234551', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235341', '2', '100030513200234552', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235342', '2', '100030513200234553', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235343', '2', '100030513200234554', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235344', '2', '100030513200234558', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235345', '2', '100030513200234559', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235346', '2', '100030513200234560', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235347', '2', '100030513200234561', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235348', '2', '100030513200234562', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235349', '2', '100030513200234563', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235350', '2', '100030513200234539', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235351', '2', '100030513200234540', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235352', '2', '100030513200234541', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235353', '2', '100030513200234542', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235354', '2', '100030513200234543', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235355', '2', '100030513200234544', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235356', '2', '100030513200234545', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235357', '2', '100030513200234546', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235358', '2', '100030513200234547', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235359', '2', '100030513200234548', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235360', '2', '100030513200234549', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235361', '2', '100030513200234550', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235362', '2', '100030513200234528', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235363', '2', '100030513200234531', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235364', '2', '100030513200234532', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235365', '2', '100030513200234533', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235366', '2', '100030513200234534', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235367', '2', '100030513200234535', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235368', '2', '100030513200234536', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235369', '2', '100030513200234537', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235370', '2', '100030513200234538', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235371', '2', '100030513200234673', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235372', '2', '100030513200234555', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235373', '2', '100030513200234556', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235374', '2', '100030513200234557', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235375', '2', '100030513200234551', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235376', '2', '100030513200234552', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235377', '2', '100030513200234553', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235378', '2', '100030513200234554', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235379', '2', '100030513200234558', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235380', '2', '100030513200234559', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235381', '2', '100030513200234560', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235382', '2', '100030513200234561', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235383', '2', '100030513200234562', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235384', '2', '100030513200234563', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235385', '2', '100030513200234539', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235386', '2', '100030513200234540', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235387', '2', '100030513200234541', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235388', '2', '100030513200234542', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235389', '2', '100030513200234543', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235390', '2', '100030513200234544', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235391', '2', '100030513200234545', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235392', '2', '100030513200234546', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235393', '2', '100030513200234547', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235394', '2', '100030513200234548', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235395', '2', '100030513200234549', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235396', '2', '100030513200234550', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235397', '2', '100030513200234528', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235398', '2', '100030513200234531', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235399', '2', '100030513200234533', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235400', '2', '100030513200234534', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235401', '2', '100030513200234535', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235402', '2', '100030513200234536', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235403', '2', '100030513200234537', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235404', '2', '100030513200234538', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235405', '2', '100030513200234673', 'a004822c02daa18d17efe88f9c2beb76', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235406', '2', '100030513200234555', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235407', '2', '100030513200234556', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235408', '2', '100030513200234557', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235409', '2', '100030513200234551', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235410', '2', '100030513200234552', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235411', '2', '100030513200234553', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235412', '2', '100030513200234554', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235413', '2', '100030513200234558', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235414', '2', '100030513200234560', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235415', '2', '100030513200234561', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235416', '2', '100030513200234562', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235417', '2', '100030513200234563', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235418', '2', '100030513200234539', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235419', '2', '100030513200234540', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235420', '2', '100030513200234541', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235421', '2', '100030513200234542', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235422', '2', '100030513200234543', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235423', '2', '100030513200234544', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235424', '2', '100030513200234545', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235425', '2', '100030513200234548', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235426', '2', '100030513200234549', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235427', '2', '100030513200234528', 'a6e694224780c2d3af6a57f1687a48af', '2', '0', '0', '2022-11-11 15:40:10', '2022-11-11 15:40:10', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235428', '2', '100030513200234555', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235429', '2', '100030513200234556', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235430', '2', '100030513200234557', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235431', '2', '100030513200234551', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235432', '2', '100030513200234552', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235433', '2', '100030513200234553', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235434', '2', '100030513200234554', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235435', '2', '100030513200234558', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235436', '2', '100030513200234559', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235437', '2', '100030513200234560', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235438', '2', '100030513200234561', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235439', '2', '100030513200234562', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235440', '2', '100030513200234563', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235441', '2', '100030513200234539', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235442', '2', '100030513200234540', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235443', '2', '100030513200234541', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235444', '2', '100030513200234542', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235445', '2', '100030513200234543', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235446', '2', '100030513200234544', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235447', '2', '100030513200234545', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235448', '2', '100030513200234546', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235449', '2', '100030513200234547', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235450', '2', '100030513200234548', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235451', '2', '100030513200234549', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235452', '2', '100030513200234550', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235453', '2', '100030513200234528', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235454', '2', '100030513200234531', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235455', '2', '100030513200234532', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235456', '2', '100030513200234533', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235457', '2', '100030513200234534', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235458', '2', '100030513200234535', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235459', '2', '100030513200234536', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235460', '2', '100030513200234537', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235461', '2', '100030513200234538', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235462', '2', '100030513200234673', 'd88628e6231cc8f2ffec1da16e3103b2', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235463', '2', '100030513200234555', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235464', '2', '100030513200234556', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235465', '2', '100030513200234557', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235466', '2', '100030513200234551', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235467', '2', '100030513200234552', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235468', '2', '100030513200234553', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235469', '2', '100030513200234554', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235470', '2', '100030513200234558', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235471', '2', '100030513200234559', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235472', '2', '100030513200234560', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235473', '2', '100030513200234561', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235474', '2', '100030513200234562', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235475', '2', '100030513200234563', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235476', '2', '100030513200234539', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235477', '2', '100030513200234540', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235478', '2', '100030513200234541', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235479', '2', '100030513200234542', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235480', '2', '100030513200234543', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235481', '2', '100030513200234544', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235482', '2', '100030513200234545', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235483', '2', '100030513200234546', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235484', '2', '100030513200234547', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235485', '2', '100030513200234548', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235486', '2', '100030513200234549', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235487', '2', '100030513200234550', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235488', '2', '100030513200234528', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235489', '2', '100030513200234531', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235490', '2', '100030513200234533', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235491', '2', '100030513200234534', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235492', '2', '100030513200234535', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235493', '2', '100030513200234536', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235494', '2', '100030513200234537', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235495', '2', '100030513200234538', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235496', '2', '100030513200234673', 'abec132ecbf942a9a96faf176fa306b6', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235497', '2', '100030513200234555', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235498', '2', '100030513200234556', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235499', '2', '100030513200234557', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235500', '2', '100030513200234551', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235501', '2', '100030513200234552', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235502', '2', '100030513200234553', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235503', '2', '100030513200234554', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235504', '2', '100030513200234558', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235505', '2', '100030513200234560', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235506', '2', '100030513200234561', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235507', '2', '100030513200234562', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235508', '2', '100030513200234563', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235509', '2', '100030513200234539', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235510', '2', '100030513200234540', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235511', '2', '100030513200234541', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235512', '2', '100030513200234542', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235513', '2', '100030513200234543', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235514', '2', '100030513200234544', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235515', '2', '100030513200234545', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235516', '2', '100030513200234548', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235517', '2', '100030513200234549', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235518', '2', '100030513200234528', 'b1385bcc54a07a519d8a06af4bbd8cb7', '2', '0', '0', '2022-11-11 15:41:24', '2022-11-11 15:41:24', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235523', '2', '100030513200234555', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235524', '2', '100030513200234556', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235525', '2', '100030513200234557', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235526', '2', '100030513200234551', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235527', '2', '100030513200234552', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235528', '2', '100030513200234553', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235529', '2', '100030513200234554', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235530', '2', '100030513200234558', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235531', '2', '100030513200234559', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235532', '2', '100030513200234560', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235533', '2', '100030513200234561', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235534', '2', '100030513200234562', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235535', '2', '100030513200234563', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235536', '2', '100030513200234539', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235537', '2', '100030513200234540', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235538', '2', '100030513200234541', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235539', '2', '100030513200234542', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235540', '2', '100030513200234543', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235541', '2', '100030513200234544', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235542', '2', '100030513200234545', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235543', '2', '100030513200234546', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235544', '2', '100030513200234547', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235545', '2', '100030513200234548', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235546', '2', '100030513200234549', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235547', '2', '100030513200234550', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235548', '2', '100030513200234528', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235549', '2', '100030513200234531', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235550', '2', '100030513200234532', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235551', '2', '100030513200234533', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235552', '2', '100030513200234534', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235553', '2', '100030513200234535', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235554', '2', '100030513200234536', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235555', '2', '100030513200234537', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235556', '2', '100030513200234538', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235557', '2', '100030513200234673', '2fecd4b38156b0b884c13771bdbf30d3', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235558', '2', '100030513200234555', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235559', '2', '100030513200234556', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235560', '2', '100030513200234557', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235561', '2', '100030513200234551', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235562', '2', '100030513200234552', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235563', '2', '100030513200234553', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235564', '2', '100030513200234554', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235565', '2', '100030513200234558', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235566', '2', '100030513200234559', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235567', '2', '100030513200234560', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235568', '2', '100030513200234561', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235569', '2', '100030513200234562', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235570', '2', '100030513200234563', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235571', '2', '100030513200234539', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235572', '2', '100030513200234540', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235573', '2', '100030513200234541', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235574', '2', '100030513200234542', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235575', '2', '100030513200234543', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235576', '2', '100030513200234544', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235577', '2', '100030513200234545', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235578', '2', '100030513200234546', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235579', '2', '100030513200234547', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235580', '2', '100030513200234548', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235581', '2', '100030513200234549', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235582', '2', '100030513200234550', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235583', '2', '100030513200234528', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235584', '2', '100030513200234531', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235585', '2', '100030513200234533', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235586', '2', '100030513200234534', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235587', '2', '100030513200234535', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235588', '2', '100030513200234536', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235589', '2', '100030513200234537', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235590', '2', '100030513200234538', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235591', '2', '100030513200234673', '90071fbee9038da87e4c981862893bcc', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235592', '2', '100030513200234555', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235593', '2', '100030513200234556', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235594', '2', '100030513200234557', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235595', '2', '100030513200234551', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235596', '2', '100030513200234552', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235597', '2', '100030513200234553', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235598', '2', '100030513200234554', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235599', '2', '100030513200234558', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235600', '2', '100030513200234560', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235601', '2', '100030513200234561', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235602', '2', '100030513200234562', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235603', '2', '100030513200234563', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235604', '2', '100030513200234539', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235605', '2', '100030513200234540', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235606', '2', '100030513200234541', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235607', '2', '100030513200234542', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235608', '2', '100030513200234543', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235609', '2', '100030513200234544', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235610', '2', '100030513200234545', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235611', '2', '100030513200234548', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235612', '2', '100030513200234549', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235613', '2', '100030513200234528', '69d9182bc3edf558ed3f2db2a767ce5f', '2', '0', '0', '2022-11-12 03:47:12', '2022-11-12 03:47:12', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235897', '2', '100030513200234528', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235898', '2', '100030513200234531', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235899', '2', '100030513200234673', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235900', '2', '100030513200234533', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235901', '2', '100030513200234534', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235902', '2', '100030513200234535', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235903', '2', '100030513200234536', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235904', '2', '100030513200234537', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235905', '2', '100030513200234538', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235906', '2', '100030513200234539', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235907', '2', '100030513200234540', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235908', '2', '100030513200234541', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235909', '2', '100030513200234542', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235910', '2', '100030513200234543', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235911', '2', '100030513200234544', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235912', '2', '100030513200234545', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235913', '2', '100030513200234546', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235914', '2', '100030513200234547', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235915', '2', '100030513200234548', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235916', '2', '100030513200234549', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235917', '2', '100030513200234550', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235918', '2', '100030513200234551', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235919', '2', '100030513200234552', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235920', '2', '100030513200234553', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235921', '2', '100030513200234554', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235922', '2', '100030513200234555', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235923', '2', '100030513200234556', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235924', '2', '100030513200234557', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235925', '2', '100030513200234558', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235926', '2', '100030513200234560', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235927', '2', '100030513200234561', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235928', '2', '100030513200234562', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235929', '2', '100030513200234563', 'c703e1e54dfa9ecc56e3482aecca6984', '2', '0', '0', '2022-11-12 05:46:09', '2022-11-12 05:46:09', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235930', '2', '100030513200234528', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235931', '2', '100030513200234531', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235932', '2', '100030513200234532', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235933', '2', '100030513200234673', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235934', '2', '100030513200234533', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235935', '2', '100030513200234534', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235936', '2', '100030513200234535', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235937', '2', '100030513200234536', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235938', '2', '100030513200234537', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235939', '2', '100030513200234538', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235940', '2', '100030513200234539', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235941', '2', '100030513200234540', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235942', '2', '100030513200234541', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235943', '2', '100030513200234542', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235944', '2', '100030513200234543', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235945', '2', '100030513200234544', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235946', '2', '100030513200234545', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235947', '2', '100030513200234546', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235948', '2', '100030513200234547', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235949', '2', '100030513200234548', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235950', '2', '100030513200234549', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235951', '2', '100030513200234550', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235952', '2', '100030513200234551', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235953', '2', '100030513200234552', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235954', '2', '100030513200234553', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235955', '2', '100030513200234554', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235956', '2', '100030513200234555', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235957', '2', '100030513200234556', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235958', '2', '100030513200234557', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235959', '2', '100030513200234558', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235960', '2', '100030513200234559', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235961', '2', '100030513200234560', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235962', '2', '100030513200234561', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235963', '2', '100030513200234562', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235964', '2', '100030513200234563', 'ca67ea40617c8819a40e9fa46f202635', '2', '0', '0', '2022-11-12 05:48:22', '2022-11-12 05:48:22', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235965', '2', '100030513200234528', '14b74eb0668ecda5c5a2c57cb0b38884', '2', '0', '0', '2022-11-12 05:48:38', '2022-11-12 05:48:38', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235966', '2', '100030513200234539', '14b74eb0668ecda5c5a2c57cb0b38884', '2', '0', '0', '2022-11-12 05:48:38', '2022-11-12 05:48:38', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235967', '2', '100030513200234541', '14b74eb0668ecda5c5a2c57cb0b38884', '2', '0', '0', '2022-11-12 05:48:38', '2022-11-12 05:48:38', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235968', '2', '100030513200234542', '14b74eb0668ecda5c5a2c57cb0b38884', '2', '0', '0', '2022-11-12 05:48:38', '2022-11-12 05:48:38', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235969', '2', '100030513200234543', '14b74eb0668ecda5c5a2c57cb0b38884', '2', '0', '0', '2022-11-12 05:48:38', '2022-11-12 05:48:38', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235970', '2', '100030513200234544', '14b74eb0668ecda5c5a2c57cb0b38884', '2', '0', '0', '2022-11-12 05:48:38', '2022-11-12 05:48:38', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235971', '2', '100030513200234545', '14b74eb0668ecda5c5a2c57cb0b38884', '2', '0', '0', '2022-11-12 05:48:38', '2022-11-12 05:48:38', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235972', '2', '100030513200234548', '14b74eb0668ecda5c5a2c57cb0b38884', '2', '0', '0', '2022-11-12 05:48:38', '2022-11-12 05:48:38', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235973', '2', '100030513200234549', '14b74eb0668ecda5c5a2c57cb0b38884', '2', '0', '0', '2022-11-12 05:48:38', '2022-11-12 05:48:38', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235974', '2', '100030513200234551', '14b74eb0668ecda5c5a2c57cb0b38884', '2', '0', '0', '2022-11-12 05:48:38', '2022-11-12 05:48:38', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235975', '2', '100030513200234552', '14b74eb0668ecda5c5a2c57cb0b38884', '2', '0', '0', '2022-11-12 05:48:38', '2022-11-12 05:48:38', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235976', '2', '100030513200234553', '14b74eb0668ecda5c5a2c57cb0b38884', '2', '0', '0', '2022-11-12 05:48:38', '2022-11-12 05:48:38', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235977', '2', '100030513200234554', '14b74eb0668ecda5c5a2c57cb0b38884', '2', '0', '0', '2022-11-12 05:48:38', '2022-11-12 05:48:38', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235978', '2', '100030513200234555', '14b74eb0668ecda5c5a2c57cb0b38884', '2', '0', '0', '2022-11-12 05:48:38', '2022-11-12 05:48:38', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235979', '2', '100030513200234556', '14b74eb0668ecda5c5a2c57cb0b38884', '2', '0', '0', '2022-11-12 05:48:38', '2022-11-12 05:48:38', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235980', '2', '100030513200234557', '14b74eb0668ecda5c5a2c57cb0b38884', '2', '0', '0', '2022-11-12 05:48:38', '2022-11-12 05:48:38', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235981', '2', '100030513200234558', '14b74eb0668ecda5c5a2c57cb0b38884', '2', '0', '0', '2022-11-12 05:48:38', '2022-11-12 05:48:38', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235982', '2', '100030513200234560', '14b74eb0668ecda5c5a2c57cb0b38884', '2', '0', '0', '2022-11-12 05:48:38', '2022-11-12 05:48:38', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235983', '2', '100030513200234561', '14b74eb0668ecda5c5a2c57cb0b38884', '2', '0', '0', '2022-11-12 05:48:38', '2022-11-12 05:48:38', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235984', '2', '100030513200234562', '14b74eb0668ecda5c5a2c57cb0b38884', '2', '0', '0', '2022-11-12 05:48:38', '2022-11-12 05:48:38', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235987', '2', '100030513200234555', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235988', '2', '100030513200234556', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235989', '2', '100030513200234557', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235990', '2', '100030513200234551', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235991', '2', '100030513200234552', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235992', '2', '100030513200234553', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235993', '2', '100030513200234554', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235994', '2', '100030513200234558', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235995', '2', '100030513200234559', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235996', '2', '100030513200234560', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235997', '2', '100030513200234561', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235998', '2', '100030513200234562', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200235999', '2', '100030513200234563', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236000', '2', '100030513200234539', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236001', '2', '100030513200234540', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236002', '2', '100030513200234541', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236003', '2', '100030513200234542', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236004', '2', '100030513200234543', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236005', '2', '100030513200234544', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236006', '2', '100030513200234545', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236007', '2', '100030513200234546', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236008', '2', '100030513200234547', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236009', '2', '100030513200234548', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236010', '2', '100030513200234549', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236011', '2', '100030513200234550', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236012', '2', '100030513200234531', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236013', '2', '100030513200234532', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236014', '2', '100030513200234533', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236015', '2', '100030513200234534', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236016', '2', '100030513200234535', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236017', '2', '100030513200234536', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236018', '2', '100030513200234537', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236019', '2', '100030513200234538', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236020', '2', '100030513200234673', '8fd2a2595b94a76001bc12588f4ae974', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236021', '2', '100030513200234555', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236022', '2', '100030513200234556', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236023', '2', '100030513200234557', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236024', '2', '100030513200234551', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236025', '2', '100030513200234552', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236026', '2', '100030513200234553', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236027', '2', '100030513200234554', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236028', '2', '100030513200234558', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236029', '2', '100030513200234559', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236030', '2', '100030513200234560', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236031', '2', '100030513200234561', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236032', '2', '100030513200234562', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236033', '2', '100030513200234563', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236034', '2', '100030513200234539', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236035', '2', '100030513200234540', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236036', '2', '100030513200234541', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236037', '2', '100030513200234542', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236038', '2', '100030513200234543', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236039', '2', '100030513200234544', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236040', '2', '100030513200234545', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236041', '2', '100030513200234546', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236042', '2', '100030513200234547', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236043', '2', '100030513200234548', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236044', '2', '100030513200234549', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236045', '2', '100030513200234550', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236046', '2', '100030513200234531', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236047', '2', '100030513200234533', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236048', '2', '100030513200234534', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236049', '2', '100030513200234535', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236050', '2', '100030513200234536', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236051', '2', '100030513200234537', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236052', '2', '100030513200234538', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236053', '2', '100030513200234673', '5a5c0eeabb7022fab706ec3cc3849852', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236054', '2', '100030513200234555', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236055', '2', '100030513200234556', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236056', '2', '100030513200234557', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236057', '2', '100030513200234551', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236058', '2', '100030513200234552', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236059', '2', '100030513200234553', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236060', '2', '100030513200234554', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236061', '2', '100030513200234558', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236062', '2', '100030513200234560', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236063', '2', '100030513200234561', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236064', '2', '100030513200234562', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236065', '2', '100030513200234563', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236066', '2', '100030513200234539', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236067', '2', '100030513200234540', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236068', '2', '100030513200234541', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236069', '2', '100030513200234542', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236070', '2', '100030513200234543', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236071', '2', '100030513200234544', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236072', '2', '100030513200234545', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236073', '2', '100030513200234548', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236074', '2', '100030513200234549', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2', '0', '0', '2022-11-14 07:47:44', '2022-11-14 07:47:44', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236079', '2', '100030513200234555', '100030513200234566', '2', '0', '0', '2022-11-15 11:12:58', '2022-11-15 11:12:58', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236080', '2', '100030513200234556', '100030513200234566', '2', '0', '0', '2022-11-15 11:12:58', '2022-11-15 11:12:58', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236081', '2', '100030513200234557', '100030513200234566', '2', '0', '0', '2022-11-15 11:12:58', '2022-11-15 11:12:58', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236082', '2', '100030513200234551', '100030513200234566', '2', '0', '0', '2022-11-15 11:12:58', '2022-11-15 11:12:58', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236083', '2', '100030513200234552', '100030513200234566', '2', '0', '0', '2022-11-15 11:12:58', '2022-11-15 11:12:58', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236084', '2', '100030513200234553', '100030513200234566', '2', '0', '0', '2022-11-15 11:12:58', '2022-11-15 11:12:58', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236085', '2', '100030513200234554', '100030513200234566', '2', '0', '0', '2022-11-15 11:12:58', '2022-11-15 11:12:58', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236086', '2', '100030513200234558', '100030513200234566', '2', '0', '0', '2022-11-15 11:12:58', '2022-11-15 11:12:58', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236087', '2', '100030513200234560', '100030513200234566', '2', '0', '0', '2022-11-15 11:12:58', '2022-11-15 11:12:58', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236088', '2', '100030513200234561', '100030513200234566', '2', '0', '0', '2022-11-15 11:12:58', '2022-11-15 11:12:58', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236089', '2', '100030513200234562', '100030513200234566', '2', '0', '0', '2022-11-15 11:12:58', '2022-11-15 11:12:58', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236090', '2', '100030513200234563', '100030513200234566', '2', '0', '0', '2022-11-15 11:12:58', '2022-11-15 11:12:58', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236091', '2', '100030513200234540', '100030513200234566', '2', '0', '0', '2022-11-15 11:12:58', '2022-11-15 11:12:58', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236092', '2', '100030513200234541', '100030513200234566', '2', '0', '0', '2022-11-15 11:12:58', '2022-11-15 11:12:58', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236093', '2', '100030513200234542', '100030513200234566', '2', '0', '0', '2022-11-15 11:12:58', '2022-11-15 11:12:58', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236094', '2', '100030513200234543', '100030513200234566', '2', '0', '0', '2022-11-15 11:12:58', '2022-11-15 11:12:58', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236095', '2', '100030513200234544', '100030513200234566', '2', '0', '0', '2022-11-15 11:12:58', '2022-11-15 11:12:58', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236096', '2', '100030513200234546', '100030513200234566', '2', '0', '0', '2022-11-15 11:12:58', '2022-11-15 11:12:58', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236097', '2', '100030513200234548', '100030513200234566', '2', '0', '0', '2022-11-15 11:12:58', '2022-11-15 11:12:58', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236098', '2', '100030513200234549', '100030513200234566', '2', '0', '0', '2022-11-15 11:12:58', '2022-11-15 11:12:58', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236099', '2', '100030513200234536', '100030513200234566', '2', '0', '0', '2022-11-15 11:12:58', '2022-11-15 11:12:58', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236100', '2', '100030513200234555', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236101', '2', '100030513200234556', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236102', '2', '100030513200234557', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236103', '2', '100030513200234551', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236104', '2', '100030513200234552', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236105', '2', '100030513200234553', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236106', '2', '100030513200234554', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236107', '2', '100030513200234558', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236108', '2', '100030513200234559', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236109', '2', '100030513200234560', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236110', '2', '100030513200234561', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236111', '2', '100030513200234562', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236112', '2', '100030513200234563', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236113', '2', '100030513200234540', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236114', '2', '100030513200234541', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236115', '2', '100030513200234542', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236116', '2', '100030513200234543', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236117', '2', '100030513200234544', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236118', '2', '100030513200234545', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236119', '2', '100030513200234546', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236120', '2', '100030513200234547', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236121', '2', '100030513200234548', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236122', '2', '100030513200234549', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236123', '2', '100030513200234550', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236124', '2', '100030513200234531', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236125', '2', '100030513200234532', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236126', '2', '100030513200234533', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236127', '2', '100030513200234534', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236128', '2', '100030513200234535', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236129', '2', '100030513200234536', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236130', '2', '100030513200234537', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236131', '2', '100030513200234538', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236132', '2', '100030513200234673', '058b1e9d65489c064f6a0a644bc9a1fc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236133', '2', '100030513200234555', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236134', '2', '100030513200234556', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236135', '2', '100030513200234557', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236136', '2', '100030513200234551', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236137', '2', '100030513200234552', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236138', '2', '100030513200234553', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236139', '2', '100030513200234554', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236140', '2', '100030513200234558', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236141', '2', '100030513200234559', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236142', '2', '100030513200234560', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236143', '2', '100030513200234561', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236144', '2', '100030513200234562', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236145', '2', '100030513200234563', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236146', '2', '100030513200234540', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236147', '2', '100030513200234541', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236148', '2', '100030513200234542', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236149', '2', '100030513200234543', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236150', '2', '100030513200234544', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236151', '2', '100030513200234545', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236152', '2', '100030513200234546', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236153', '2', '100030513200234547', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236154', '2', '100030513200234548', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236155', '2', '100030513200234549', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236156', '2', '100030513200234550', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236157', '2', '100030513200234531', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236158', '2', '100030513200234533', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236159', '2', '100030513200234534', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236160', '2', '100030513200234535', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236161', '2', '100030513200234536', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236162', '2', '100030513200234537', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236163', '2', '100030513200234538', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236164', '2', '100030513200234673', '0d0244228b4e61c600da1bafda7fe888', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236165', '2', '100030513200234555', '679ce4ec0df53c7e1c5b175398c8bfcc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236166', '2', '100030513200234556', '679ce4ec0df53c7e1c5b175398c8bfcc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236167', '2', '100030513200234557', '679ce4ec0df53c7e1c5b175398c8bfcc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236168', '2', '100030513200234551', '679ce4ec0df53c7e1c5b175398c8bfcc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236169', '2', '100030513200234552', '679ce4ec0df53c7e1c5b175398c8bfcc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236170', '2', '100030513200234553', '679ce4ec0df53c7e1c5b175398c8bfcc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236171', '2', '100030513200234554', '679ce4ec0df53c7e1c5b175398c8bfcc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236172', '2', '100030513200234558', '679ce4ec0df53c7e1c5b175398c8bfcc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236173', '2', '100030513200234560', '679ce4ec0df53c7e1c5b175398c8bfcc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236174', '2', '100030513200234561', '679ce4ec0df53c7e1c5b175398c8bfcc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236175', '2', '100030513200234562', '679ce4ec0df53c7e1c5b175398c8bfcc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236176', '2', '100030513200234563', '679ce4ec0df53c7e1c5b175398c8bfcc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236177', '2', '100030513200234540', '679ce4ec0df53c7e1c5b175398c8bfcc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236178', '2', '100030513200234541', '679ce4ec0df53c7e1c5b175398c8bfcc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236179', '2', '100030513200234542', '679ce4ec0df53c7e1c5b175398c8bfcc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236180', '2', '100030513200234543', '679ce4ec0df53c7e1c5b175398c8bfcc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236181', '2', '100030513200234544', '679ce4ec0df53c7e1c5b175398c8bfcc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236182', '2', '100030513200234545', '679ce4ec0df53c7e1c5b175398c8bfcc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236183', '2', '100030513200234548', '679ce4ec0df53c7e1c5b175398c8bfcc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236184', '2', '100030513200234549', '679ce4ec0df53c7e1c5b175398c8bfcc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236185', '2', '100030513200234536', '679ce4ec0df53c7e1c5b175398c8bfcc', '2', '0', '0', '2022-11-15 11:19:28', '2022-11-15 11:19:28', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236187', '2', '100030513200234555', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236188', '2', '100030513200234556', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236189', '2', '100030513200234557', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236190', '2', '100030513200234551', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236191', '2', '100030513200234552', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236192', '2', '100030513200234553', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236193', '2', '100030513200234554', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236194', '2', '100030513200234558', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236195', '2', '100030513200234559', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236196', '2', '100030513200234560', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236197', '2', '100030513200234561', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236198', '2', '100030513200234562', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236199', '2', '100030513200234563', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236200', '2', '100030513200234540', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236201', '2', '100030513200234541', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236202', '2', '100030513200234542', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236203', '2', '100030513200234543', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236204', '2', '100030513200234544', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236205', '2', '100030513200234545', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236206', '2', '100030513200234546', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236207', '2', '100030513200234547', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236208', '2', '100030513200234548', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236209', '2', '100030513200234549', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236210', '2', '100030513200234550', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236211', '2', '100030513200234531', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236212', '2', '100030513200234532', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236213', '2', '100030513200234533', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236214', '2', '100030513200234534', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236215', '2', '100030513200234535', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236216', '2', '100030513200234536', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236217', '2', '100030513200234537', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236218', '2', '100030513200234538', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236219', '2', '100030513200234673', '74d710a687b15914e2f80f5b0502ef47', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236220', '2', '100030513200234555', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236221', '2', '100030513200234556', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236222', '2', '100030513200234557', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236223', '2', '100030513200234551', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236224', '2', '100030513200234552', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236225', '2', '100030513200234553', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236226', '2', '100030513200234554', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236227', '2', '100030513200234558', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236228', '2', '100030513200234559', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236229', '2', '100030513200234560', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236230', '2', '100030513200234561', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236231', '2', '100030513200234562', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236232', '2', '100030513200234563', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236233', '2', '100030513200234540', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236234', '2', '100030513200234541', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236235', '2', '100030513200234542', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236236', '2', '100030513200234543', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236237', '2', '100030513200234544', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236238', '2', '100030513200234545', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236239', '2', '100030513200234546', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236240', '2', '100030513200234547', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236241', '2', '100030513200234548', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236242', '2', '100030513200234549', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236243', '2', '100030513200234550', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236244', '2', '100030513200234531', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236245', '2', '100030513200234533', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236246', '2', '100030513200234534', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236247', '2', '100030513200234535', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236248', '2', '100030513200234536', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236249', '2', '100030513200234537', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236250', '2', '100030513200234538', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236251', '2', '100030513200234673', '70758b444e022241fa13287de8f8d13a', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236252', '2', '100030513200234555', 'bde4a9cc60589765b1e1d9c27efb9948', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236253', '2', '100030513200234556', 'bde4a9cc60589765b1e1d9c27efb9948', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236254', '2', '100030513200234557', 'bde4a9cc60589765b1e1d9c27efb9948', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236255', '2', '100030513200234551', 'bde4a9cc60589765b1e1d9c27efb9948', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236256', '2', '100030513200234552', 'bde4a9cc60589765b1e1d9c27efb9948', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236257', '2', '100030513200234553', 'bde4a9cc60589765b1e1d9c27efb9948', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236258', '2', '100030513200234554', 'bde4a9cc60589765b1e1d9c27efb9948', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236259', '2', '100030513200234558', 'bde4a9cc60589765b1e1d9c27efb9948', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236260', '2', '100030513200234560', 'bde4a9cc60589765b1e1d9c27efb9948', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236261', '2', '100030513200234561', 'bde4a9cc60589765b1e1d9c27efb9948', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236262', '2', '100030513200234562', 'bde4a9cc60589765b1e1d9c27efb9948', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236263', '2', '100030513200234563', 'bde4a9cc60589765b1e1d9c27efb9948', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236264', '2', '100030513200234540', 'bde4a9cc60589765b1e1d9c27efb9948', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236265', '2', '100030513200234541', 'bde4a9cc60589765b1e1d9c27efb9948', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236266', '2', '100030513200234542', 'bde4a9cc60589765b1e1d9c27efb9948', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236267', '2', '100030513200234543', 'bde4a9cc60589765b1e1d9c27efb9948', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236268', '2', '100030513200234544', 'bde4a9cc60589765b1e1d9c27efb9948', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236269', '2', '100030513200234545', 'bde4a9cc60589765b1e1d9c27efb9948', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236270', '2', '100030513200234548', 'bde4a9cc60589765b1e1d9c27efb9948', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236271', '2', '100030513200234549', 'bde4a9cc60589765b1e1d9c27efb9948', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100030513200236272', '2', '100030513200234536', 'bde4a9cc60589765b1e1d9c27efb9948', '2', '0', '0', '2022-11-18 13:59:53', '2022-11-18 13:59:53', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696384', '2', '100030513200234555', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696385', '2', '100030513200234556', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696386', '2', '100030513200234557', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696387', '2', '100030513200234551', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696388', '2', '100030513200234552', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696389', '2', '100030513200234553', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696390', '2', '100030513200234554', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696391', '2', '100030513200234558', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696392', '2', '100030513200234559', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696393', '2', '100030513200234560', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696394', '2', '100030513200234561', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696395', '2', '100030513200234562', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696396', '2', '100030513200234563', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696397', '2', '100030513200234540', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696398', '2', '100030513200234541', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696399', '2', '100030513200234542', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696400', '2', '100030513200234543', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696401', '2', '100030513200234544', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696402', '2', '100030513200234545', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696403', '2', '100030513200234546', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696404', '2', '100030513200234547', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696405', '2', '100030513200234548', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696406', '2', '100030513200234549', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696407', '2', '100030513200234550', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696408', '2', '100030513200234531', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696409', '2', '100030513200234532', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696410', '2', '100030513200234533', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696411', '2', '100030513200234534', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696412', '2', '100030513200234535', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696413', '2', '100030513200234536', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696414', '2', '100030513200234537', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696415', '2', '100030513200234538', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696416', '2', '100030513200234673', '5d9eabb72a12bf7898c8c812bcfff6a2', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696417', '2', '100030513200234555', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696418', '2', '100030513200234556', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696419', '2', '100030513200234557', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696420', '2', '100030513200234551', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696421', '2', '100030513200234552', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696422', '2', '100030513200234553', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696423', '2', '100030513200234554', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696424', '2', '100030513200234558', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696425', '2', '100030513200234559', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696426', '2', '100030513200234560', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696427', '2', '100030513200234561', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696428', '2', '100030513200234562', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696429', '2', '100030513200234563', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696430', '2', '100030513200234540', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696431', '2', '100030513200234541', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696432', '2', '100030513200234542', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696433', '2', '100030513200234543', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696434', '2', '100030513200234544', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696435', '2', '100030513200234545', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696436', '2', '100030513200234546', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696437', '2', '100030513200234547', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696438', '2', '100030513200234548', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696439', '2', '100030513200234549', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696440', '2', '100030513200234550', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696441', '2', '100030513200234531', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696442', '2', '100030513200234533', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696443', '2', '100030513200234534', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696444', '2', '100030513200234535', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696445', '2', '100030513200234536', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696446', '2', '100030513200234537', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696447', '2', '100030513200234538', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696448', '2', '100030513200234673', 'ff4ea4bc28bb3709177562e19049e86b', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696449', '2', '100030513200234555', '7bae2a1a83dde74d9add85dd8f0f5320', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696450', '2', '100030513200234556', '7bae2a1a83dde74d9add85dd8f0f5320', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696451', '2', '100030513200234557', '7bae2a1a83dde74d9add85dd8f0f5320', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696452', '2', '100030513200234551', '7bae2a1a83dde74d9add85dd8f0f5320', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696453', '2', '100030513200234552', '7bae2a1a83dde74d9add85dd8f0f5320', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696454', '2', '100030513200234553', '7bae2a1a83dde74d9add85dd8f0f5320', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696455', '2', '100030513200234554', '7bae2a1a83dde74d9add85dd8f0f5320', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696456', '2', '100030513200234558', '7bae2a1a83dde74d9add85dd8f0f5320', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696457', '2', '100030513200234560', '7bae2a1a83dde74d9add85dd8f0f5320', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696458', '2', '100030513200234561', '7bae2a1a83dde74d9add85dd8f0f5320', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696459', '2', '100030513200234562', '7bae2a1a83dde74d9add85dd8f0f5320', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696460', '2', '100030513200234563', '7bae2a1a83dde74d9add85dd8f0f5320', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696461', '2', '100030513200234540', '7bae2a1a83dde74d9add85dd8f0f5320', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696462', '2', '100030513200234541', '7bae2a1a83dde74d9add85dd8f0f5320', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696463', '2', '100030513200234542', '7bae2a1a83dde74d9add85dd8f0f5320', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696464', '2', '100030513200234543', '7bae2a1a83dde74d9add85dd8f0f5320', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696465', '2', '100030513200234544', '7bae2a1a83dde74d9add85dd8f0f5320', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696466', '2', '100030513200234545', '7bae2a1a83dde74d9add85dd8f0f5320', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696467', '2', '100030513200234548', '7bae2a1a83dde74d9add85dd8f0f5320', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696468', '2', '100030513200234549', '7bae2a1a83dde74d9add85dd8f0f5320', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696469', '2', '100030513200234536', '7bae2a1a83dde74d9add85dd8f0f5320', '2', '0', '0', '2023-01-08 02:30:57', '2023-01-08 02:30:57', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696473', '2', '100030513200234555', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696474', '2', '100030513200234556', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696475', '2', '100030513200234557', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696476', '2', '100030513200234551', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696477', '2', '100030513200234552', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696478', '2', '100030513200234553', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696479', '2', '100030513200234554', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696480', '2', '100030513200234558', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696481', '2', '100030513200234559', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696482', '2', '100030513200234560', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696483', '2', '100030513200234561', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696484', '2', '100030513200234562', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696485', '2', '100030513200234563', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696486', '2', '100030513200234540', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696487', '2', '100030513200234541', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696488', '2', '100030513200234542', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696489', '2', '100030513200234543', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696490', '2', '100030513200234544', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696491', '2', '100030513200234545', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696492', '2', '100030513200234546', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696493', '2', '100030513200234547', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696494', '2', '100030513200234548', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696495', '2', '100030513200234549', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696496', '2', '100030513200234550', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696497', '2', '100030513200234531', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696498', '2', '100030513200234532', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696499', '2', '100030513200234533', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696500', '2', '100030513200234534', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696501', '2', '100030513200234535', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696502', '2', '100030513200234536', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696503', '2', '100030513200234537', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696504', '2', '100030513200234538', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696505', '2', '100030513200234673', '186a114853766c6b8137fc5159a33076', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696506', '2', '100030513200234555', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696507', '2', '100030513200234556', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696508', '2', '100030513200234557', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696509', '2', '100030513200234551', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696510', '2', '100030513200234552', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696511', '2', '100030513200234553', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696512', '2', '100030513200234554', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696513', '2', '100030513200234558', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696514', '2', '100030513200234559', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696515', '2', '100030513200234560', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696516', '2', '100030513200234561', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696517', '2', '100030513200234562', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696518', '2', '100030513200234563', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696519', '2', '100030513200234540', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696520', '2', '100030513200234541', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696521', '2', '100030513200234542', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696522', '2', '100030513200234543', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696523', '2', '100030513200234544', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696524', '2', '100030513200234545', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696525', '2', '100030513200234546', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696526', '2', '100030513200234547', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696527', '2', '100030513200234548', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696528', '2', '100030513200234549', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696529', '2', '100030513200234550', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696530', '2', '100030513200234531', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696531', '2', '100030513200234533', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696532', '2', '100030513200234534', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696533', '2', '100030513200234535', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696534', '2', '100030513200234536', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696535', '2', '100030513200234537', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696536', '2', '100030513200234538', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696537', '2', '100030513200234673', '0a156c44815ce17f3ca23a2096f853e0', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696538', '2', '100030513200234555', '4e70ee2f258adef2b40ed00c77bcaa81', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696539', '2', '100030513200234556', '4e70ee2f258adef2b40ed00c77bcaa81', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696540', '2', '100030513200234557', '4e70ee2f258adef2b40ed00c77bcaa81', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696541', '2', '100030513200234551', '4e70ee2f258adef2b40ed00c77bcaa81', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696542', '2', '100030513200234552', '4e70ee2f258adef2b40ed00c77bcaa81', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696543', '2', '100030513200234553', '4e70ee2f258adef2b40ed00c77bcaa81', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696544', '2', '100030513200234554', '4e70ee2f258adef2b40ed00c77bcaa81', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696545', '2', '100030513200234558', '4e70ee2f258adef2b40ed00c77bcaa81', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696546', '2', '100030513200234560', '4e70ee2f258adef2b40ed00c77bcaa81', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696547', '2', '100030513200234561', '4e70ee2f258adef2b40ed00c77bcaa81', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696548', '2', '100030513200234562', '4e70ee2f258adef2b40ed00c77bcaa81', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696549', '2', '100030513200234563', '4e70ee2f258adef2b40ed00c77bcaa81', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696550', '2', '100030513200234540', '4e70ee2f258adef2b40ed00c77bcaa81', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696551', '2', '100030513200234541', '4e70ee2f258adef2b40ed00c77bcaa81', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696552', '2', '100030513200234542', '4e70ee2f258adef2b40ed00c77bcaa81', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696553', '2', '100030513200234543', '4e70ee2f258adef2b40ed00c77bcaa81', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696554', '2', '100030513200234544', '4e70ee2f258adef2b40ed00c77bcaa81', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696555', '2', '100030513200234545', '4e70ee2f258adef2b40ed00c77bcaa81', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696556', '2', '100030513200234548', '4e70ee2f258adef2b40ed00c77bcaa81', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696557', '2', '100030513200234549', '4e70ee2f258adef2b40ed00c77bcaa81', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100127057991696558', '2', '100030513200234536', '4e70ee2f258adef2b40ed00c77bcaa81', '2', '0', '0', '2023-01-08 07:44:15', '2023-01-08 07:44:15', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019520', '2', '100030513200234555', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019521', '2', '100030513200234556', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019522', '2', '100030513200234557', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019523', '2', '100030513200234551', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019524', '2', '100030513200234552', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019525', '2', '100030513200234553', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019526', '2', '100030513200234554', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019527', '2', '100030513200234558', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019528', '2', '100030513200234559', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019529', '2', '100030513200234560', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019530', '2', '100030513200234561', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019531', '2', '100030513200234562', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019532', '2', '100030513200234563', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019533', '2', '100030513200234540', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019534', '2', '100030513200234541', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019535', '2', '100030513200234542', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019536', '2', '100030513200234543', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019537', '2', '100030513200234544', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019538', '2', '100030513200234545', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019539', '2', '100030513200234546', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019540', '2', '100030513200234547', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019541', '2', '100030513200234548', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019542', '2', '100030513200234549', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019543', '2', '100030513200234550', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019544', '2', '100030513200234531', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019545', '2', '100030513200234532', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019546', '2', '100030513200234533', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019547', '2', '100030513200234534', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019548', '2', '100030513200234535', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019549', '2', '100030513200234536', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019550', '2', '100030513200234537', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019551', '2', '100030513200234538', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019552', '2', '100030513200234673', '89c6ca4480d3e414de7a0ccafe58a7b0', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019553', '2', '100030513200234555', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019554', '2', '100030513200234556', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019555', '2', '100030513200234557', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019556', '2', '100030513200234551', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019557', '2', '100030513200234552', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019558', '2', '100030513200234553', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019559', '2', '100030513200234554', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019560', '2', '100030513200234558', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019561', '2', '100030513200234559', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019562', '2', '100030513200234560', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019563', '2', '100030513200234561', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019564', '2', '100030513200234562', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019565', '2', '100030513200234563', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019566', '2', '100030513200234540', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019567', '2', '100030513200234541', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019568', '2', '100030513200234542', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019569', '2', '100030513200234543', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019570', '2', '100030513200234544', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019571', '2', '100030513200234545', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019572', '2', '100030513200234546', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019573', '2', '100030513200234547', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019574', '2', '100030513200234548', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019575', '2', '100030513200234549', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019576', '2', '100030513200234550', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019577', '2', '100030513200234531', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019578', '2', '100030513200234533', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019579', '2', '100030513200234534', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019580', '2', '100030513200234535', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019581', '2', '100030513200234536', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019582', '2', '100030513200234537', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019583', '2', '100030513200234538', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019584', '2', '100030513200234673', 'b66588a8aedcc0f9402db97b1dd346cb', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019585', '2', '100030513200234555', 'ccc98c07b719c4614855741186a38d26', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019586', '2', '100030513200234556', 'ccc98c07b719c4614855741186a38d26', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019587', '2', '100030513200234557', 'ccc98c07b719c4614855741186a38d26', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019588', '2', '100030513200234551', 'ccc98c07b719c4614855741186a38d26', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019589', '2', '100030513200234552', 'ccc98c07b719c4614855741186a38d26', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019590', '2', '100030513200234553', 'ccc98c07b719c4614855741186a38d26', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019591', '2', '100030513200234554', 'ccc98c07b719c4614855741186a38d26', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019592', '2', '100030513200234558', 'ccc98c07b719c4614855741186a38d26', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019593', '2', '100030513200234560', 'ccc98c07b719c4614855741186a38d26', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019594', '2', '100030513200234561', 'ccc98c07b719c4614855741186a38d26', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019595', '2', '100030513200234562', 'ccc98c07b719c4614855741186a38d26', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019596', '2', '100030513200234563', 'ccc98c07b719c4614855741186a38d26', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019597', '2', '100030513200234540', 'ccc98c07b719c4614855741186a38d26', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019598', '2', '100030513200234541', 'ccc98c07b719c4614855741186a38d26', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019599', '2', '100030513200234542', 'ccc98c07b719c4614855741186a38d26', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019600', '2', '100030513200234543', 'ccc98c07b719c4614855741186a38d26', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019601', '2', '100030513200234544', 'ccc98c07b719c4614855741186a38d26', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019602', '2', '100030513200234545', 'ccc98c07b719c4614855741186a38d26', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019603', '2', '100030513200234548', 'ccc98c07b719c4614855741186a38d26', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019604', '2', '100030513200234549', 'ccc98c07b719c4614855741186a38d26', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019605', '2', '100030513200234536', 'ccc98c07b719c4614855741186a38d26', '2', '0', '0', '2023-03-25 12:22:14', '2023-03-25 12:22:14', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019615', '2', '100030513200234555', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019616', '2', '100030513200234556', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019617', '2', '100030513200234557', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019618', '2', '100030513200234551', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019619', '2', '100030513200234552', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019620', '2', '100030513200234553', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019621', '2', '100030513200234554', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019622', '2', '100030513200234558', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019623', '2', '100030513200234559', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019624', '2', '100030513200234560', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019625', '2', '100030513200234561', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019626', '2', '100030513200234562', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019627', '2', '100030513200234563', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019628', '2', '100030513200234540', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019629', '2', '100030513200234541', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019630', '2', '100030513200234542', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019631', '2', '100030513200234543', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019632', '2', '100030513200234544', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019633', '2', '100030513200234545', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019634', '2', '100030513200234546', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019635', '2', '100030513200234547', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019636', '2', '100030513200234548', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019637', '2', '100030513200234549', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019638', '2', '100030513200234550', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019639', '2', '100030513200234531', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019640', '2', '100030513200234532', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019641', '2', '100030513200234533', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019642', '2', '100030513200234534', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019643', '2', '100030513200234535', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019644', '2', '100030513200234536', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019645', '2', '100030513200234537', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019646', '2', '100030513200234538', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019647', '2', '100030513200234673', '923498fd965fe23d33621dfb6f58ce1a', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019648', '2', '100030513200234555', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019649', '2', '100030513200234556', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019650', '2', '100030513200234557', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019651', '2', '100030513200234551', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019652', '2', '100030513200234552', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019653', '2', '100030513200234553', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019654', '2', '100030513200234554', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019655', '2', '100030513200234558', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019656', '2', '100030513200234559', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019657', '2', '100030513200234560', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019658', '2', '100030513200234561', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019659', '2', '100030513200234562', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019660', '2', '100030513200234563', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019661', '2', '100030513200234540', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019662', '2', '100030513200234541', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019663', '2', '100030513200234542', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019664', '2', '100030513200234543', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019665', '2', '100030513200234544', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019666', '2', '100030513200234545', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019667', '2', '100030513200234546', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019668', '2', '100030513200234547', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019669', '2', '100030513200234548', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019670', '2', '100030513200234549', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019671', '2', '100030513200234550', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019672', '2', '100030513200234531', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019673', '2', '100030513200234533', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019674', '2', '100030513200234534', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019675', '2', '100030513200234535', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019676', '2', '100030513200234536', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019677', '2', '100030513200234537', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019678', '2', '100030513200234538', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019679', '2', '100030513200234673', '0a5bb08c989acd06a22c2810bb25ba4f', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019680', '2', '100030513200234555', '1fdf4e6b381d07fe599624034d00ab37', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019681', '2', '100030513200234556', '1fdf4e6b381d07fe599624034d00ab37', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019682', '2', '100030513200234557', '1fdf4e6b381d07fe599624034d00ab37', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019683', '2', '100030513200234551', '1fdf4e6b381d07fe599624034d00ab37', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019684', '2', '100030513200234552', '1fdf4e6b381d07fe599624034d00ab37', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019685', '2', '100030513200234553', '1fdf4e6b381d07fe599624034d00ab37', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019686', '2', '100030513200234554', '1fdf4e6b381d07fe599624034d00ab37', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019687', '2', '100030513200234558', '1fdf4e6b381d07fe599624034d00ab37', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019688', '2', '100030513200234560', '1fdf4e6b381d07fe599624034d00ab37', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019689', '2', '100030513200234561', '1fdf4e6b381d07fe599624034d00ab37', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019690', '2', '100030513200234562', '1fdf4e6b381d07fe599624034d00ab37', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019691', '2', '100030513200234563', '1fdf4e6b381d07fe599624034d00ab37', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019692', '2', '100030513200234540', '1fdf4e6b381d07fe599624034d00ab37', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019693', '2', '100030513200234541', '1fdf4e6b381d07fe599624034d00ab37', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019694', '2', '100030513200234542', '1fdf4e6b381d07fe599624034d00ab37', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019695', '2', '100030513200234543', '1fdf4e6b381d07fe599624034d00ab37', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019696', '2', '100030513200234544', '1fdf4e6b381d07fe599624034d00ab37', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019697', '2', '100030513200234545', '1fdf4e6b381d07fe599624034d00ab37', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019698', '2', '100030513200234548', '1fdf4e6b381d07fe599624034d00ab37', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019699', '2', '100030513200234549', '1fdf4e6b381d07fe599624034d00ab37', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100208093975019700', '2', '100030513200234536', '1fdf4e6b381d07fe599624034d00ab37', '2', '0', '0', '2023-03-25 13:38:34', '2023-03-25 13:38:34', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861761', '2', '100030513200234531', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861762', '2', '100030513200234532', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861763', '2', '100030513200234533', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861764', '2', '100030513200234534', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861765', '2', '100030513200234535', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861766', '2', '100030513200234536', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861767', '2', '100030513200234537', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861768', '2', '100030513200234538', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861769', '2', '100030513200234673', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861770', '2', '100030513200234540', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861771', '2', '100030513200234541', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861772', '2', '100030513200234542', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861773', '2', '100030513200234543', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861774', '2', '100030513200234544', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861775', '2', '100030513200234545', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861776', '2', '100030513200234546', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861777', '2', '100030513200234547', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861778', '2', '100030513200234548', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861779', '2', '100030513200234549', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861780', '2', '100030513200234550', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861781', '2', '100030513200234551', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861782', '2', '100030513200234552', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861783', '2', '100030513200234553', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861784', '2', '100030513200234554', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861785', '2', '100030513200234555', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861786', '2', '100030513200234556', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861787', '2', '100030513200234557', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861788', '2', '100030513200234558', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861789', '2', '100030513200234559', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861790', '2', '100030513200234560', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861791', '2', '100030513200234561', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861792', '2', '100030513200234562', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861793', '2', '100030513200234563', 'e6afb6338a488f62f569707334b08e9e', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861794', '2', '100030513200234555', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861795', '2', '100030513200234556', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861796', '2', '100030513200234557', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861797', '2', '100030513200234551', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861798', '2', '100030513200234552', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861799', '2', '100030513200234553', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861800', '2', '100030513200234554', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861801', '2', '100030513200234558', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861802', '2', '100030513200234559', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861803', '2', '100030513200234560', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861804', '2', '100030513200234561', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861805', '2', '100030513200234562', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861806', '2', '100030513200234563', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861807', '2', '100030513200234540', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861808', '2', '100030513200234541', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861809', '2', '100030513200234542', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861810', '2', '100030513200234543', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861811', '2', '100030513200234544', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861812', '2', '100030513200234545', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861813', '2', '100030513200234546', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861814', '2', '100030513200234547', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861815', '2', '100030513200234548', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861816', '2', '100030513200234549', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861817', '2', '100030513200234550', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861818', '2', '100030513200234531', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861819', '2', '100030513200234533', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861820', '2', '100030513200234534', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861821', '2', '100030513200234535', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861822', '2', '100030513200234536', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861823', '2', '100030513200234537', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861824', '2', '100030513200234538', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861825', '2', '100030513200234673', '04210701a7c32d34509a865d072fb7be', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861826', '2', '100030513200234555', '47ff4c793518cb411453d2af56613c6d', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861827', '2', '100030513200234556', '47ff4c793518cb411453d2af56613c6d', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861828', '2', '100030513200234557', '47ff4c793518cb411453d2af56613c6d', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861829', '2', '100030513200234551', '47ff4c793518cb411453d2af56613c6d', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861830', '2', '100030513200234552', '47ff4c793518cb411453d2af56613c6d', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861831', '2', '100030513200234553', '47ff4c793518cb411453d2af56613c6d', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861832', '2', '100030513200234554', '47ff4c793518cb411453d2af56613c6d', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861833', '2', '100030513200234558', '47ff4c793518cb411453d2af56613c6d', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861834', '2', '100030513200234560', '47ff4c793518cb411453d2af56613c6d', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861835', '2', '100030513200234561', '47ff4c793518cb411453d2af56613c6d', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861836', '2', '100030513200234562', '47ff4c793518cb411453d2af56613c6d', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861837', '2', '100030513200234563', '47ff4c793518cb411453d2af56613c6d', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861838', '2', '100030513200234540', '47ff4c793518cb411453d2af56613c6d', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861839', '2', '100030513200234541', '47ff4c793518cb411453d2af56613c6d', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861840', '2', '100030513200234542', '47ff4c793518cb411453d2af56613c6d', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861841', '2', '100030513200234543', '47ff4c793518cb411453d2af56613c6d', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861842', '2', '100030513200234544', '47ff4c793518cb411453d2af56613c6d', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861843', '2', '100030513200234545', '47ff4c793518cb411453d2af56613c6d', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861844', '2', '100030513200234548', '47ff4c793518cb411453d2af56613c6d', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861845', '2', '100030513200234549', '47ff4c793518cb411453d2af56613c6d', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100266692847861846', '2', '100030513200234536', '47ff4c793518cb411453d2af56613c6d', '2', '0', '0', '2023-04-13 13:54:07', '2023-04-13 13:54:07', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714177', '2', '100030513200234555', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714178', '2', '100030513200234556', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714179', '2', '100030513200234557', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714180', '2', '100030513200234551', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714181', '2', '100030513200234552', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714182', '2', '100030513200234553', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714183', '2', '100030513200234554', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714184', '2', '100030513200234558', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714185', '2', '100030513200234559', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714186', '2', '100030513200234560', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714187', '2', '100030513200234561', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714188', '2', '100030513200234562', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714189', '2', '100030513200234563', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714190', '2', '100030513200234540', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714191', '2', '100030513200234541', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714192', '2', '100030513200234542', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714193', '2', '100030513200234543', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714194', '2', '100030513200234544', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714195', '2', '100030513200234545', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714196', '2', '100030513200234546', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714197', '2', '100030513200234547', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714198', '2', '100030513200234548', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714199', '2', '100030513200234549', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714200', '2', '100030513200234550', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714201', '2', '100030513200234531', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714202', '2', '100030513200234532', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714203', '2', '100030513200234533', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714204', '2', '100030513200234534', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714205', '2', '100030513200234535', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714206', '2', '100030513200234536', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714207', '2', '100030513200234537', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714208', '2', '100030513200234538', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714209', '2', '100030513200234673', '1254efa4f511f023a1813a935ee0b4cb', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714210', '2', '100030513200234555', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714211', '2', '100030513200234556', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714212', '2', '100030513200234557', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714213', '2', '100030513200234551', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714214', '2', '100030513200234552', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714215', '2', '100030513200234553', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714216', '2', '100030513200234554', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714217', '2', '100030513200234558', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714218', '2', '100030513200234559', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714219', '2', '100030513200234560', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714220', '2', '100030513200234561', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714221', '2', '100030513200234562', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714222', '2', '100030513200234563', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714223', '2', '100030513200234540', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714224', '2', '100030513200234541', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714225', '2', '100030513200234542', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714226', '2', '100030513200234543', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714227', '2', '100030513200234544', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714228', '2', '100030513200234545', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714229', '2', '100030513200234546', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714230', '2', '100030513200234547', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714231', '2', '100030513200234548', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714232', '2', '100030513200234549', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714233', '2', '100030513200234550', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714234', '2', '100030513200234531', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714235', '2', '100030513200234533', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714236', '2', '100030513200234534', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714237', '2', '100030513200234535', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714238', '2', '100030513200234536', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714239', '2', '100030513200234537', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714240', '2', '100030513200234538', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714241', '2', '100030513200234673', '9031149b9fe58a678c5d47fefc75140e', '2', '0', '0', '2023-07-09 16:48:03', '2023-07-09 16:48:03', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714242', '2', '100030513200234555', '678f3c98f34319f0939a846b4234dc80', '2', '0', '0', '2023-07-09 16:48:04', '2023-07-09 16:48:04', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714243', '2', '100030513200234556', '678f3c98f34319f0939a846b4234dc80', '2', '0', '0', '2023-07-09 16:48:04', '2023-07-09 16:48:04', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714244', '2', '100030513200234557', '678f3c98f34319f0939a846b4234dc80', '2', '0', '0', '2023-07-09 16:48:04', '2023-07-09 16:48:04', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714245', '2', '100030513200234551', '678f3c98f34319f0939a846b4234dc80', '2', '0', '0', '2023-07-09 16:48:04', '2023-07-09 16:48:04', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714246', '2', '100030513200234552', '678f3c98f34319f0939a846b4234dc80', '2', '0', '0', '2023-07-09 16:48:04', '2023-07-09 16:48:04', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714247', '2', '100030513200234553', '678f3c98f34319f0939a846b4234dc80', '2', '0', '0', '2023-07-09 16:48:04', '2023-07-09 16:48:04', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714248', '2', '100030513200234554', '678f3c98f34319f0939a846b4234dc80', '2', '0', '0', '2023-07-09 16:48:04', '2023-07-09 16:48:04', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714249', '2', '100030513200234558', '678f3c98f34319f0939a846b4234dc80', '2', '0', '0', '2023-07-09 16:48:04', '2023-07-09 16:48:04', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714250', '2', '100030513200234560', '678f3c98f34319f0939a846b4234dc80', '2', '0', '0', '2023-07-09 16:48:04', '2023-07-09 16:48:04', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714251', '2', '100030513200234561', '678f3c98f34319f0939a846b4234dc80', '2', '0', '0', '2023-07-09 16:48:04', '2023-07-09 16:48:04', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714252', '2', '100030513200234562', '678f3c98f34319f0939a846b4234dc80', '2', '0', '0', '2023-07-09 16:48:04', '2023-07-09 16:48:04', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714253', '2', '100030513200234563', '678f3c98f34319f0939a846b4234dc80', '2', '0', '0', '2023-07-09 16:48:04', '2023-07-09 16:48:04', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714254', '2', '100030513200234540', '678f3c98f34319f0939a846b4234dc80', '2', '0', '0', '2023-07-09 16:48:04', '2023-07-09 16:48:04', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714255', '2', '100030513200234541', '678f3c98f34319f0939a846b4234dc80', '2', '0', '0', '2023-07-09 16:48:04', '2023-07-09 16:48:04', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714256', '2', '100030513200234542', '678f3c98f34319f0939a846b4234dc80', '2', '0', '0', '2023-07-09 16:48:04', '2023-07-09 16:48:04', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714257', '2', '100030513200234543', '678f3c98f34319f0939a846b4234dc80', '2', '0', '0', '2023-07-09 16:48:04', '2023-07-09 16:48:04', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714258', '2', '100030513200234544', '678f3c98f34319f0939a846b4234dc80', '2', '0', '0', '2023-07-09 16:48:04', '2023-07-09 16:48:04', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714259', '2', '100030513200234545', '678f3c98f34319f0939a846b4234dc80', '2', '0', '0', '2023-07-09 16:48:04', '2023-07-09 16:48:04', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714260', '2', '100030513200234548', '678f3c98f34319f0939a846b4234dc80', '2', '0', '0', '2023-07-09 16:48:04', '2023-07-09 16:48:04', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714261', '2', '100030513200234549', '678f3c98f34319f0939a846b4234dc80', '2', '0', '0', '2023-07-09 16:48:04', '2023-07-09 16:48:04', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('100390671457714262', '2', '100030513200234536', '678f3c98f34319f0939a846b4234dc80', '2', '0', '0', '2023-07-09 16:48:04', '2023-07-09 16:48:04', '2', NULL);
INSERT INTO `sys_privilege` VALUES ('1227', '1', '160', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1228', '1', '159', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1229', '1', '162', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1230', '1', '161', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1231', '1', '157', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1232', '1', '148', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1233', '1', '158', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1234', '1', '149', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1235', '1', '147', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1236', '1', '146', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1237', '1', '152', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1238', '1', '154', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1239', '1', '153', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1240', '1', '155', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1241', '1', '151', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1242', '1', '150', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1243', '1', '140', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1244', '1', '145', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1245', '1', '168', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1246', '1', '138', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1247', '1', '144', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1248', '1', '142', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1249', '1', '141', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1250', '1', '165', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1251', '1', '167', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1252', '1', '164', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1253', '1', '166', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1254', '1', '170', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1255', '1', '163', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1256', '1', '169', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1257', '1', '172', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1258', '1', '156', '5', '1', '0', '0', '2020-09-04 10:39:52', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1735', '1', '169', '4', '1', '0', '0', '2020-09-07 15:56:37', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1736', '1', '170', '4', '1', '0', '0', '2020-09-07 15:56:37', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1737', '1', '172', '4', '1', '0', '0', '2020-09-07 15:56:37', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1771', '1', '92', '4', '2', '0', '0', '2020-09-07 15:58:09', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1772', '1', '90', '4', '2', '0', '0', '2020-09-07 15:58:09', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1773', '1', '93', '4', '2', '0', '0', '2020-09-07 15:58:09', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1774', '1', '88', '4', '2', '0', '0', '2020-09-07 15:58:09', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1775', '1', '89', '4', '2', '0', '0', '2020-09-07 15:58:09', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1776', '1', '91', '4', '2', '0', '0', '2020-09-07 15:58:09', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1777', '1', '73', '4', '2', '0', '0', '2020-09-07 15:58:09', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1778', '1', '75', '4', '2', '0', '0', '2020-09-07 15:58:09', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1779', '1', '74', '4', '2', '0', '0', '2020-09-07 15:58:09', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('1780', '1', '72', '4', '2', '0', '0', '2020-09-07 15:58:09', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('2249', '1', '179', '1', '1', '0', '0', '2020-09-10 15:51:54', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('2250', '1', '180', '1', '1', '0', '0', '2020-09-10 15:51:54', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('4121', '1', '162', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4122', '1', '163', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4123', '1', '164', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4124', '1', '134', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4125', '1', '135', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4126', '1', '136', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4127', '1', '137', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4128', '1', '196', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4129', '1', '183', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4130', '1', '185', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4131', '1', '184', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4132', '1', '188', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4133', '1', '165', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4134', '1', '166', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4135', '1', '168', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4136', '1', '167', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4137', '1', '156', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4138', '1', '157', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4139', '1', '158', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4140', '1', '159', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4141', '1', '138', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4142', '1', '141', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4143', '1', '139', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4144', '1', '140', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4145', '1', '142', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4146', '1', '148', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4147', '1', '149', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4148', '1', '143', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4149', '1', '146', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4150', '1', '144', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4151', '1', '145', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4152', '1', '147', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4153', '1', '186', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4154', '1', '187', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4155', '1', '192', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4156', '1', '190', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4157', '1', '191', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4158', '1', '189', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4159', '1', '150', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4160', '1', '151', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4161', '1', '152', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4162', '1', '194', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4163', '1', '193', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4164', '1', '195', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4165', '1', '153', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4166', '1', '155', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4167', '1', '154', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4168', '1', '160', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4169', '1', '161', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4170', '1', '169', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4171', '1', '176', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4172', '1', '182', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4173', '1', '173', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4174', '1', '177', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4175', '1', '174', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4176', '1', '175', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4177', '1', '181', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4178', '1', '172', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4179', '1', '170', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4180', '1', '178', '1', '1', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4184', '2', '16', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4185', '2', '17', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4186', '2', '18', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4187', '2', '19', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4188', '2', '20', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4189', '2', '21', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4190', '2', '22', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4191', '2', '23', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4192', '2', '24', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4193', '2', '25', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4194', '2', '26', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4195', '2', '27', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4196', '2', '64', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4197', '2', '65', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4198', '2', '66', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4199', '2', '67', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4200', '2', '68', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4201', '2', '69', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4202', '2', '76', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4203', '2', '77', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4204', '2', '78', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4205', '2', '79', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4206', '2', '80', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4207', '2', '81', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4208', '2', '82', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4209', '2', '83', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4210', '2', '84', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4211', '2', '85', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4212', '2', '86', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4213', '2', '87', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4214', '2', '94', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4215', '2', '95', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4216', '2', '96', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4217', '2', '97', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4218', '2', '98', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4219', '2', '99', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4220', '2', '115', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4221', '2', '88', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4222', '2', '89', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4223', '2', '90', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4224', '2', '91', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4225', '2', '92', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4226', '2', '93', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4227', '2', '107', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4228', '2', '139', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4229', '2', '141', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4230', '2', '142', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4231', '2', '70', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4232', '2', '71', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4233', '2', '72', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4234', '2', '73', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4235', '2', '74', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4236', '2', '75', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4237', '2', '100', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4238', '2', '129', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4239', '2', '132', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4240', '2', '138', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4241', '2', '140', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4242', '2', '28', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4243', '2', '29', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4244', '2', '30', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4245', '2', '31', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4246', '2', '32', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4247', '2', '33', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4248', '2', '40', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4249', '2', '41', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4250', '2', '42', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4251', '2', '43', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4252', '2', '44', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4253', '2', '45', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4254', '2', '46', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4255', '2', '47', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4256', '2', '48', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4257', '2', '49', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4258', '2', '50', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4259', '2', '51', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4260', '2', '101', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4261', '2', '102', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4262', '2', '103', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4263', '2', '104', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4264', '2', '105', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4265', '2', '106', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4266', '2', '34', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4267', '2', '35', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4268', '2', '36', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4269', '2', '37', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4270', '2', '38', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4271', '2', '39', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4272', '2', '52', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4273', '2', '53', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4274', '2', '54', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4275', '2', '55', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4276', '2', '56', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4277', '2', '57', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4278', '2', '133', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4279', '2', '58', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4280', '2', '59', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4281', '2', '60', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4282', '2', '61', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4283', '2', '62', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4284', '2', '63', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4285', '2', '131', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4286', '2', '10', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4287', '2', '11', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4288', '2', '12', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4289', '2', '13', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4290', '2', '14', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4291', '2', '15', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4292', '2', '135', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4293', '2', '109', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4294', '2', '110', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4295', '2', '111', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4296', '2', '112', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4297', '2', '113', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4298', '2', '114', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4299', '2', '128', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4300', '2', '116', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4301', '2', '117', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4302', '2', '118', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4303', '2', '119', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4304', '2', '120', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4305', '2', '121', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4306', '2', '122', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4307', '2', '123', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4308', '2', '124', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4309', '2', '125', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4310', '2', '126', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('4311', '2', '127', '1', '2', '0', '0', '2021-07-18 10:05:28', '2021-07-18 10:05:28', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa0273-f68a-11eb-b60b-0242ac120002', '1', '162', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa0903-f68a-11eb-b60b-0242ac120002', '1', '163', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa09c2-f68a-11eb-b60b-0242ac120002', '1', '164', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa0a48-f68a-11eb-b60b-0242ac120002', '1', '134', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa0ac3-f68a-11eb-b60b-0242ac120002', '1', '135', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa0b3b-f68a-11eb-b60b-0242ac120002', '1', '136', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa0ba6-f68a-11eb-b60b-0242ac120002', '1', '137', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa0c0d-f68a-11eb-b60b-0242ac120002', '1', '196', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa0c70-f68a-11eb-b60b-0242ac120002', '1', '183', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa0cd3-f68a-11eb-b60b-0242ac120002', '1', '185', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa0d32-f68a-11eb-b60b-0242ac120002', '1', '184', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa0d95-f68a-11eb-b60b-0242ac120002', '1', '188', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa0df3-f68a-11eb-b60b-0242ac120002', '1', '165', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa0e58-f68a-11eb-b60b-0242ac120002', '1', '166', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa0eb8-f68a-11eb-b60b-0242ac120002', '1', '168', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa0f19-f68a-11eb-b60b-0242ac120002', '1', '167', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa0f77-f68a-11eb-b60b-0242ac120002', '1', '156', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa0fd7-f68a-11eb-b60b-0242ac120002', '1', '157', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa1037-f68a-11eb-b60b-0242ac120002', '1', '158', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa1096-f68a-11eb-b60b-0242ac120002', '1', '159', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa10f8-f68a-11eb-b60b-0242ac120002', '1', '138', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa1158-f68a-11eb-b60b-0242ac120002', '1', '141', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa11b6-f68a-11eb-b60b-0242ac120002', '1', '139', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa1216-f68a-11eb-b60b-0242ac120002', '1', '140', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa1279-f68a-11eb-b60b-0242ac120002', '1', '142', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa13bf-f68a-11eb-b60b-0242ac120002', '1', '148', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa1456-f68a-11eb-b60b-0242ac120002', '1', '149', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa14ca-f68a-11eb-b60b-0242ac120002', '1', '143', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa153a-f68a-11eb-b60b-0242ac120002', '1', '146', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa169c-f68a-11eb-b60b-0242ac120002', '1', '144', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa1747-f68a-11eb-b60b-0242ac120002', '1', '145', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa17b6-f68a-11eb-b60b-0242ac120002', '1', '147', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa181f-f68a-11eb-b60b-0242ac120002', '1', '186', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa1885-f68a-11eb-b60b-0242ac120002', '1', '187', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa18ed-f68a-11eb-b60b-0242ac120002', '1', '192', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa1957-f68a-11eb-b60b-0242ac120002', '1', '190', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa19be-f68a-11eb-b60b-0242ac120002', '1', '191', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa1a26-f68a-11eb-b60b-0242ac120002', '1', '189', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa1a8b-f68a-11eb-b60b-0242ac120002', '1', '150', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa1af0-f68a-11eb-b60b-0242ac120002', '1', '151', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa1b54-f68a-11eb-b60b-0242ac120002', '1', '152', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa1bc8-f68a-11eb-b60b-0242ac120002', '1', '194', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa2359-f68a-11eb-b60b-0242ac120002', '1', '193', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa2b3c-f68a-11eb-b60b-0242ac120002', '1', '195', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa2bd4-f68a-11eb-b60b-0242ac120002', '1', '153', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa2c42-f68a-11eb-b60b-0242ac120002', '1', '155', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa2cad-f68a-11eb-b60b-0242ac120002', '1', '154', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa2d1a-f68a-11eb-b60b-0242ac120002', '1', '160', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa2d7f-f68a-11eb-b60b-0242ac120002', '1', '161', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa2de2-f68a-11eb-b60b-0242ac120002', '1', '169', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa2e43-f68a-11eb-b60b-0242ac120002', '1', '176', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa2ea8-f68a-11eb-b60b-0242ac120002', '1', '182', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa2f0b-f68a-11eb-b60b-0242ac120002', '1', '173', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa2f70-f68a-11eb-b60b-0242ac120002', '1', '177', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa2fd0-f68a-11eb-b60b-0242ac120002', '1', '174', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa3033-f68a-11eb-b60b-0242ac120002', '1', '175', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa3096-f68a-11eb-b60b-0242ac120002', '1', '181', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa30f7-f68a-11eb-b60b-0242ac120002', '1', '172', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa3159-f68a-11eb-b60b-0242ac120002', '1', '170', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fa31bb-f68a-11eb-b60b-0242ac120002', '1', '178', '8', '1', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb29c8-f68a-11eb-b60b-0242ac120002', '2', '115', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb2b86-f68a-11eb-b60b-0242ac120002', '2', '16', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb2c1b-f68a-11eb-b60b-0242ac120002', '2', '17', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb2c9c-f68a-11eb-b60b-0242ac120002', '2', '18', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb2d11-f68a-11eb-b60b-0242ac120002', '2', '19', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb2d88-f68a-11eb-b60b-0242ac120002', '2', '20', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb2df2-f68a-11eb-b60b-0242ac120002', '2', '21', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb2e5d-f68a-11eb-b60b-0242ac120002', '2', '22', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb2ec8-f68a-11eb-b60b-0242ac120002', '2', '23', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb2f36-f68a-11eb-b60b-0242ac120002', '2', '24', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb2fa0-f68a-11eb-b60b-0242ac120002', '2', '25', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3008-f68a-11eb-b60b-0242ac120002', '2', '26', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3070-f68a-11eb-b60b-0242ac120002', '2', '27', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb30d6-f68a-11eb-b60b-0242ac120002', '2', '64', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3228-f68a-11eb-b60b-0242ac120002', '2', '65', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb32d9-f68a-11eb-b60b-0242ac120002', '2', '66', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb334b-f68a-11eb-b60b-0242ac120002', '2', '67', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb33ec-f68a-11eb-b60b-0242ac120002', '2', '68', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3493-f68a-11eb-b60b-0242ac120002', '2', '69', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3540-f68a-11eb-b60b-0242ac120002', '2', '76', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb35bf-f68a-11eb-b60b-0242ac120002', '2', '77', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3624-f68a-11eb-b60b-0242ac120002', '2', '78', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3683-f68a-11eb-b60b-0242ac120002', '2', '79', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb36e5-f68a-11eb-b60b-0242ac120002', '2', '80', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3746-f68a-11eb-b60b-0242ac120002', '2', '81', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb37a6-f68a-11eb-b60b-0242ac120002', '2', '82', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3807-f68a-11eb-b60b-0242ac120002', '2', '83', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3866-f68a-11eb-b60b-0242ac120002', '2', '84', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb38c4-f68a-11eb-b60b-0242ac120002', '2', '85', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb391f-f68a-11eb-b60b-0242ac120002', '2', '86', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3ad6-f68a-11eb-b60b-0242ac120002', '2', '87', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3b98-f68a-11eb-b60b-0242ac120002', '2', '94', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3c20-f68a-11eb-b60b-0242ac120002', '2', '95', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3c83-f68a-11eb-b60b-0242ac120002', '2', '96', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3ce1-f68a-11eb-b60b-0242ac120002', '2', '97', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3d40-f68a-11eb-b60b-0242ac120002', '2', '98', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3d9c-f68a-11eb-b60b-0242ac120002', '2', '99', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3e02-f68a-11eb-b60b-0242ac120002', '2', '107', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3e64-f68a-11eb-b60b-0242ac120002', '2', '139', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3ec1-f68a-11eb-b60b-0242ac120002', '2', '141', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3f1f-f68a-11eb-b60b-0242ac120002', '2', '142', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3f7b-f68a-11eb-b60b-0242ac120002', '2', '88', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb3fd9-f68a-11eb-b60b-0242ac120002', '2', '89', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb4036-f68a-11eb-b60b-0242ac120002', '2', '90', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb4094-f68a-11eb-b60b-0242ac120002', '2', '91', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb40f1-f68a-11eb-b60b-0242ac120002', '2', '92', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb414d-f68a-11eb-b60b-0242ac120002', '2', '93', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb41ac-f68a-11eb-b60b-0242ac120002', '2', '100', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb4208-f68a-11eb-b60b-0242ac120002', '2', '129', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb4266-f68a-11eb-b60b-0242ac120002', '2', '132', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb42c2-f68a-11eb-b60b-0242ac120002', '2', '138', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb4323-f68a-11eb-b60b-0242ac120002', '2', '140', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb4380-f68a-11eb-b60b-0242ac120002', '2', '70', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb43dd-f68a-11eb-b60b-0242ac120002', '2', '71', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb443c-f68a-11eb-b60b-0242ac120002', '2', '72', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb4499-f68a-11eb-b60b-0242ac120002', '2', '73', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb44f7-f68a-11eb-b60b-0242ac120002', '2', '74', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb4553-f68a-11eb-b60b-0242ac120002', '2', '75', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb45b5-f68a-11eb-b60b-0242ac120002', '2', '28', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb4613-f68a-11eb-b60b-0242ac120002', '2', '29', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb466f-f68a-11eb-b60b-0242ac120002', '2', '30', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb46cb-f68a-11eb-b60b-0242ac120002', '2', '31', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb4727-f68a-11eb-b60b-0242ac120002', '2', '32', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb4785-f68a-11eb-b60b-0242ac120002', '2', '33', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb47df-f68a-11eb-b60b-0242ac120002', '2', '40', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb483c-f68a-11eb-b60b-0242ac120002', '2', '41', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb489a-f68a-11eb-b60b-0242ac120002', '2', '42', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb48f6-f68a-11eb-b60b-0242ac120002', '2', '43', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb4953-f68a-11eb-b60b-0242ac120002', '2', '44', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb49af-f68a-11eb-b60b-0242ac120002', '2', '45', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fb4a0c-f68a-11eb-b60b-0242ac120002', '2', '46', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fbe28d-f68a-11eb-b60b-0242ac120002', '2', '47', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fbe3b6-f68a-11eb-b60b-0242ac120002', '2', '48', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fbe42f-f68a-11eb-b60b-0242ac120002', '2', '49', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc4129-f68a-11eb-b60b-0242ac120002', '2', '50', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc424c-f68a-11eb-b60b-0242ac120002', '2', '51', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc42c6-f68a-11eb-b60b-0242ac120002', '2', '101', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc433b-f68a-11eb-b60b-0242ac120002', '2', '102', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc43ae-f68a-11eb-b60b-0242ac120002', '2', '103', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc441c-f68a-11eb-b60b-0242ac120002', '2', '104', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc4489-f68a-11eb-b60b-0242ac120002', '2', '105', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc44f6-f68a-11eb-b60b-0242ac120002', '2', '106', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc4563-f68a-11eb-b60b-0242ac120002', '2', '34', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc45ce-f68a-11eb-b60b-0242ac120002', '2', '35', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc4639-f68a-11eb-b60b-0242ac120002', '2', '36', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc46a6-f68a-11eb-b60b-0242ac120002', '2', '37', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc4712-f68a-11eb-b60b-0242ac120002', '2', '38', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc477b-f68a-11eb-b60b-0242ac120002', '2', '39', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc47e5-f68a-11eb-b60b-0242ac120002', '2', '133', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc484e-f68a-11eb-b60b-0242ac120002', '2', '52', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc48b2-f68a-11eb-b60b-0242ac120002', '2', '53', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc4918-f68a-11eb-b60b-0242ac120002', '2', '54', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc4981-f68a-11eb-b60b-0242ac120002', '2', '55', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc49e9-f68a-11eb-b60b-0242ac120002', '2', '56', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc4a4e-f68a-11eb-b60b-0242ac120002', '2', '57', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc4ab6-f68a-11eb-b60b-0242ac120002', '2', '131', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc4bd5-f68a-11eb-b60b-0242ac120002', '2', '58', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc4c68-f68a-11eb-b60b-0242ac120002', '2', '59', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc4cce-f68a-11eb-b60b-0242ac120002', '2', '60', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc4d31-f68a-11eb-b60b-0242ac120002', '2', '61', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc4d91-f68a-11eb-b60b-0242ac120002', '2', '62', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc4df1-f68a-11eb-b60b-0242ac120002', '2', '63', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc4e51-f68a-11eb-b60b-0242ac120002', '2', '10', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc4eb1-f68a-11eb-b60b-0242ac120002', '2', '11', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc4f12-f68a-11eb-b60b-0242ac120002', '2', '12', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc4f71-f68a-11eb-b60b-0242ac120002', '2', '13', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc4fd2-f68a-11eb-b60b-0242ac120002', '2', '135', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc5033-f68a-11eb-b60b-0242ac120002', '2', '14', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc5092-f68a-11eb-b60b-0242ac120002', '2', '15', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc50f2-f68a-11eb-b60b-0242ac120002', '2', '109', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc5151-f68a-11eb-b60b-0242ac120002', '2', '110', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc51af-f68a-11eb-b60b-0242ac120002', '2', '111', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc520e-f68a-11eb-b60b-0242ac120002', '2', '112', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc526b-f68a-11eb-b60b-0242ac120002', '2', '113', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc52cc-f68a-11eb-b60b-0242ac120002', '2', '114', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc532b-f68a-11eb-b60b-0242ac120002', '2', '128', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc538a-f68a-11eb-b60b-0242ac120002', '2', '116', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc53e7-f68a-11eb-b60b-0242ac120002', '2', '117', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc5447-f68a-11eb-b60b-0242ac120002', '2', '118', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc54a6-f68a-11eb-b60b-0242ac120002', '2', '119', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc5505-f68a-11eb-b60b-0242ac120002', '2', '120', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc5566-f68a-11eb-b60b-0242ac120002', '2', '121', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc55c4-f68a-11eb-b60b-0242ac120002', '2', '122', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc5625-f68a-11eb-b60b-0242ac120002', '2', '123', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc5683-f68a-11eb-b60b-0242ac120002', '2', '124', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc56e4-f68a-11eb-b60b-0242ac120002', '2', '125', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc5744-f68a-11eb-b60b-0242ac120002', '2', '126', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('92fc57a3-f68a-11eb-b60b-0242ac120002', '2', '127', '8', '2', '0', '0', '2021-08-06 07:47:39', '2021-08-06 07:47:39', NULL, NULL);
INSERT INTO `sys_privilege` VALUES ('976', '1', '165', '3', '1', '0', '0', '2020-09-02 17:26:31', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('977', '1', '166', '3', '1', '0', '0', '2020-09-02 17:26:31', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('978', '1', '167', '3', '1', '0', '0', '2020-09-02 17:26:31', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('979', '1', '168', '3', '1', '0', '0', '2020-09-02 17:26:31', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('980', '1', '169', '3', '1', '0', '0', '2020-09-02 17:26:31', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('981', '1', '170', '3', '1', '0', '0', '2020-09-02 17:26:31', '2020-09-18 16:16:47', '2', '2');
INSERT INTO `sys_privilege` VALUES ('982', '1', '172', '3', '1', '0', '0', '2020-09-02 17:26:31', '2020-09-18 16:16:47', '2', '2');
COMMIT;

-- ----------------------------
-- Table structure for sys_role
-- ----------------------------
DROP TABLE IF EXISTS `sys_role`;
CREATE TABLE `sys_role` (
  `id` varchar(45) NOT NULL COMMENT '主键',
  `role_name` varchar(64) NOT NULL COMMENT '角色名称',
  `role_code` varchar(64) NOT NULL COMMENT '角色编码',
  `role_desc` varchar(255) DEFAULT NULL COMMENT '角色描述',
  `ds_type` char(1) NOT NULL DEFAULT '2' COMMENT '数据权限类型',
  `ds_scope` varchar(255) DEFAULT NULL COMMENT '数据权限范围',
  `project_id` varchar(64) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT '0' COMMENT '所属项目',
  `tenant_id` varchar(45) DEFAULT NULL COMMENT '所属租户',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
  `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `role_idx1_role_code` (`role_code`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统角色';

-- ----------------------------
-- Records of sys_role
-- ----------------------------
BEGIN;
INSERT INTO `sys_role` VALUES ('00e9a957636db103cbb027f80dcb5ede', '团队所有者', 'bf194caf_0', NULL, '2', NULL, '0', NULL, '0', '2022-11-11 20:47:17', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_role` VALUES ('04210701a7c32d34509a865d072fb7be', '团队管理员', '3a489281_1', NULL, '2', NULL, '0', NULL, '0', '2023-04-13 21:54:07', NULL, 'admin7', NULL);
INSERT INTO `sys_role` VALUES ('058b1e9d65489c064f6a0a644bc9a1fc', '团队所有者', '92a5641b_0', NULL, '2', NULL, '0', NULL, '0', '2022-11-15 19:19:28', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_role` VALUES ('0a156c44815ce17f3ca23a2096f853e0', '团队管理员', '559451b5_1', NULL, '2', NULL, '0', NULL, '0', '2023-01-08 15:44:15', NULL, 'admin7', NULL);
INSERT INTO `sys_role` VALUES ('0a47abd49eb027254365ae95b561c5d9', '团队普通成员', '6cd44fa2_COMMON', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 22:02:47', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('0a5bb08c989acd06a22c2810bb25ba4f', '团队管理员', '5e76f8c0_1', NULL, '2', NULL, '0', NULL, '0', '2023-03-25 21:38:35', NULL, 'admin8', NULL);
INSERT INTO `sys_role` VALUES ('0d0244228b4e61c600da1bafda7fe888', '团队管理员', '92a5641b_1', NULL, '2', NULL, '0', NULL, '0', '2022-11-15 19:19:28', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_role` VALUES ('1', 'admin', 'admin', '超级管理员', '2', '1', NULL, '1', '0', '2019-09-12 16:22:22', '2021-07-18 17:04:35', '2', '2');
INSERT INTO `sys_role` VALUES ('100024597134442523', 'erd', 'erd', 'ERD新用户', '2', '1', NULL, '1', '0', '2022-10-29 13:22:25', NULL, '2', '2');
INSERT INTO `sys_role` VALUES ('100024597134442524', 'ERD新用户', 'ERD_USER_NEW', 'ERD新用户', '2', '1', NULL, '1', '0', '2022-10-29 13:22:56', NULL, '2', '2');
INSERT INTO `sys_role` VALUES ('100030513200234564', 'ERD_DEFAULT_ADMIN', 'ERD_DEFAULT_ADMIN', NULL, '2', NULL, '0', NULL, '0', '2022-10-29 12:22:38', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('100030513200234565', 'ERD_DEFAULT_MANAGER', 'ERD_DEFAULT_MANAGER', NULL, '2', NULL, '0', NULL, '0', '2022-10-29 12:22:38', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('100030513200234566', 'ERD_DEFAULT_COMMON', 'ERD_DEFAULT_COMMON', NULL, '2', NULL, '0', NULL, '0', '2022-10-29 12:22:38', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('1254efa4f511f023a1813a935ee0b4cb', '团队所有者', '22963730_0', NULL, '2', NULL, '0', NULL, '0', '2023-07-09 16:48:04', NULL, 'admin8', NULL);
INSERT INTO `sys_role` VALUES ('12dc7c9cce60cba501a9bc041effe0ed', '团队管理员', '524b0359_1', NULL, '2', NULL, '0', NULL, '0', '2022-10-29 23:22:01', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_role` VALUES ('13632a44215002316b1c5f38466a952d', '团队普通成员', '70d096d5_2', NULL, '2', NULL, '0', NULL, '0', '2022-11-11 14:52:09', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_role` VALUES ('14b74eb0668ecda5c5a2c57cb0b38884', '团队普通成员', '5778ac5c_2', NULL, '2', NULL, '0', NULL, '0', '2022-11-12 11:51:12', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_role` VALUES ('186a114853766c6b8137fc5159a33076', '团队所有者', '559451b5_0', NULL, '2', NULL, '0', NULL, '0', '2023-01-08 15:44:15', NULL, 'admin7', NULL);
INSERT INTO `sys_role` VALUES ('19e715637b18512499eceda7b30c018f', 'COMMON', 'COMMON_89a76a3b', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 20:25:50', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('1b850e5d9ffc9c4e5b6bb363e835a204', '团队所有者', '6cd44fa2_ADMIN', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 22:02:47', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('1ee00bd4f06953422d303d59929325e0', '团队普通成员', '33b11cea_2', NULL, '2', NULL, '0', NULL, '0', '2022-11-11 20:46:51', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_role` VALUES ('1f709d16b5070a02ccfa657f5342afbd', '团队所有者', '812d4dae_0', NULL, '2', NULL, '0', NULL, '0', '2022-11-11 12:54:07', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_role` VALUES ('1fdf4e6b381d07fe599624034d00ab37', '团队普通成员', '5e76f8c0_2', NULL, '2', NULL, '0', NULL, '0', '2023-03-25 21:38:35', NULL, 'admin8', NULL);
INSERT INTO `sys_role` VALUES ('24363506557c0d003122dcc9fe6d8e1f', 'ADMIN', 'ADMIN_-592036192', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 20:18:58', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('2bffcc5fd5c51b257a3cc6cb610bf1ad', '团队所有者', '010fce99_ADMIN', NULL, '2', NULL, '0', NULL, '0', '2022-10-29 12:19:30', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('2fecd4b38156b0b884c13771bdbf30d3', '团队所有者', 'ad3a80a5_0', NULL, '2', NULL, '0', NULL, '0', '2022-11-12 11:47:12', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_role` VALUES ('3345e9d0fbf6a6e3fa771596e0baa7ce', '团队所有者', '99ea689d_0', NULL, '2', NULL, '0', NULL, '0', '2022-11-11 23:40:10', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_role` VALUES ('3adf99aedd43a9ed71cedaa10afbda17', 'ADMIN', 'ADMIN_-1659253890', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 19:55:33', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('453c79e2f743df46302f9f3e5bdaa620', 'COMMON', 'COMMON_-592036192', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 20:18:58', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('456d47fcad7024fe0212f12a084cdc6e', '团队普通成员', '524b0359_2', NULL, '2', NULL, '0', NULL, '0', '2022-10-29 23:22:01', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_role` VALUES ('4723db1a59e91bc6a3843b5159cb6c09', '团队所有者', '524b0359_0', NULL, '2', NULL, '0', NULL, '0', '2022-10-29 23:22:01', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_role` VALUES ('47ff4c793518cb411453d2af56613c6d', '团队普通成员', '3a489281_2', NULL, '2', NULL, '0', NULL, '0', '2023-04-13 21:54:07', NULL, 'admin7', NULL);
INSERT INTO `sys_role` VALUES ('4c992708a1e0c7abdbe7ccd12e43c66e', '团队管理员', '713a5995_1', NULL, '2', NULL, '0', NULL, '0', '2022-10-29 12:28:13', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('4e70ee2f258adef2b40ed00c77bcaa81', '团队普通成员', '559451b5_2', NULL, '2', NULL, '0', NULL, '0', '2023-01-08 15:44:15', NULL, 'admin7', NULL);
INSERT INTO `sys_role` VALUES ('56e52e62cbb6e9574cba7d54139c45f2', '团队所有者', '70d096d5_0', NULL, '2', NULL, '0', NULL, '0', '2022-11-11 14:52:09', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_role` VALUES ('57cbf7d6ea45a2696ec45400a263afa0', '团队普通成员', '47d4f93c_COMMON', NULL, '2', NULL, '0', NULL, '0', '2022-10-28 21:55:31', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('5a5c0eeabb7022fab706ec3cc3849852', '团队管理员', 'a3663ada_1', NULL, '2', NULL, '0', NULL, '0', '2022-11-14 15:47:44', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_role` VALUES ('5aa814d48e60884ff12535273abb32d8', 'ADMIN', 'ADMIN_1386149424', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 19:52:32', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('5d9eabb72a12bf7898c8c812bcfff6a2', '团队所有者', 'b0634f19_0', NULL, '2', NULL, '0', NULL, '0', '2023-01-08 10:30:58', NULL, 'admin7', NULL);
INSERT INTO `sys_role` VALUES ('600b9da4f1c9eb4b0780abef220c3248', '团队普通成员', 'bf194caf_2', NULL, '2', NULL, '0', NULL, '0', '2022-11-11 20:47:17', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_role` VALUES ('63427cd1d763139afc9993e2abcd1814', '团队管理员', '47d4f93c_MANAGER', NULL, '2', NULL, '0', NULL, '0', '2022-10-28 21:55:31', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('65f689074ea14bc86db02f9fb897d6cf', '团队所有者', '33b11cea_0', NULL, '2', NULL, '0', NULL, '0', '2022-11-11 20:46:51', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_role` VALUES ('678f3c98f34319f0939a846b4234dc80', '团队普通成员', '22963730_2', NULL, '2', NULL, '0', NULL, '0', '2023-07-09 16:48:04', NULL, 'admin8', NULL);
INSERT INTO `sys_role` VALUES ('679ce4ec0df53c7e1c5b175398c8bfcc', '团队普通成员', '92a5641b_2', NULL, '2', NULL, '0', NULL, '0', '2022-11-15 19:19:28', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_role` VALUES ('67a6a46efdd81d9127f0ba9d4b689713', '团队管理员', '33b11cea_1', NULL, '2', NULL, '0', NULL, '0', '2022-11-11 20:46:51', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_role` VALUES ('69d9182bc3edf558ed3f2db2a767ce5f', '团队普通成员', 'ad3a80a5_2', NULL, '2', NULL, '0', NULL, '0', '2022-11-12 11:47:12', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_role` VALUES ('6ef2b49a60501969a313808b9b566a27', '团队管理员', '010fce99_MANAGER', NULL, '2', NULL, '0', NULL, '0', '2022-10-29 12:19:30', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('70758b444e022241fa13287de8f8d13a', '团队管理员', '99f5b879_1', NULL, '2', NULL, '0', NULL, '0', '2022-11-18 21:59:53', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_role` VALUES ('727edbaf9350d7a7b5daabd7614765bf', 'ADMIN', 'ADMIN_dd48c44f', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 20:31:50', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('7323946064ab208bf80107912442609b', '团队管理员', '77de468a_1', NULL, '2', NULL, '0', NULL, '0', '2022-11-11 20:45:02', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_role` VALUES ('748e1788fe573e847615a29ad833bbda', 'MANAGER', 'MANAGER_-592036192', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 20:18:58', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('74d710a687b15914e2f80f5b0502ef47', '团队所有者', '99f5b879_0', NULL, '2', NULL, '0', NULL, '0', '2022-11-18 21:59:53', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_role` VALUES ('7ac933b11176e27e93ffe728d2cfb344', 'MANAGER', 'MANAGER_1808718025', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 20:17:54', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('7b27c5bbdf1b82ed1fc010b88bc5a1b0', '团队普通成员', '713a5995_2', NULL, '2', NULL, '0', NULL, '0', '2022-10-29 12:28:13', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('7bae2a1a83dde74d9add85dd8f0f5320', '团队普通成员', 'b0634f19_2', NULL, '2', NULL, '0', NULL, '0', '2023-01-08 10:30:58', NULL, 'admin7', NULL);
INSERT INTO `sys_role` VALUES ('7f05fe65eb2da1d86d5e0238246d71fb', 'COMMON', 'COMMON_1808718025', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 20:17:54', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('8', 'ROLE_NEW_REGISTER', 'ROLE_NEW_REGISTER', NULL, '2', NULL, NULL, NULL, '0', '2021-08-05 17:54:53', NULL, NULL, NULL);
INSERT INTO `sys_role` VALUES ('84be06a8367258e79b845c15284257b0', 'MANAGER', 'MANAGER_89a76a3b', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 20:25:50', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('89c6ca4480d3e414de7a0ccafe58a7b0', '团队所有者', 'ba8e92d8_0', NULL, '2', NULL, '0', NULL, '0', '2023-03-25 20:22:14', NULL, 'admin8', NULL);
INSERT INTO `sys_role` VALUES ('8b5069b4beaf6bfbd6c0a8ca168f4bfb', '团队普通成员', 'a3663ada_2', NULL, '2', NULL, '0', NULL, '0', '2022-11-14 15:47:44', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_role` VALUES ('8b97ad3b223ea3ab917c950c6c44e9ee', 'MANAGER', 'MANAGER_dd48c44f', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 20:31:50', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('8fd2a2595b94a76001bc12588f4ae974', '团队所有者', 'a3663ada_0', NULL, '2', NULL, '0', NULL, '0', '2022-11-14 15:47:44', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_role` VALUES ('90071fbee9038da87e4c981862893bcc', '团队管理员', 'ad3a80a5_1', NULL, '2', NULL, '0', NULL, '0', '2022-11-12 11:47:12', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_role` VALUES ('9031149b9fe58a678c5d47fefc75140e', '团队管理员', '22963730_1', NULL, '2', NULL, '0', NULL, '0', '2023-07-09 16:48:04', NULL, 'admin8', NULL);
INSERT INTO `sys_role` VALUES ('905dc84ebc343c75d50a691d020e24da', 'COMMON', 'COMMON_3af6bd8a', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 20:23:40', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('923498fd965fe23d33621dfb6f58ce1a', '团队所有者', '5e76f8c0_0', NULL, '2', NULL, '0', NULL, '0', '2023-03-25 21:38:34', NULL, 'admin8', NULL);
INSERT INTO `sys_role` VALUES ('98f9a6288de84ec1551bfad77221966d', 'ADMIN', 'ADMIN_1368101197', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 19:54:34', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('a004822c02daa18d17efe88f9c2beb76', '团队管理员', '99ea689d_1', NULL, '2', NULL, '0', NULL, '0', '2022-11-11 23:40:10', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_role` VALUES ('a6e694224780c2d3af6a57f1687a48af', '团队普通成员', '99ea689d_2', NULL, '2', NULL, '0', NULL, '0', '2022-11-11 23:40:10', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_role` VALUES ('abec132ecbf942a9a96faf176fa306b6', '团队管理员', '7e001c87_1', NULL, '2', NULL, '0', NULL, '0', '2022-11-11 23:41:25', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_role` VALUES ('b1385bcc54a07a519d8a06af4bbd8cb7', '团队普通成员', '7e001c87_2', NULL, '2', NULL, '0', NULL, '0', '2022-11-11 23:41:25', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_role` VALUES ('b4a430609cd5461f3bbd8dd96c860975', 'COMMON', 'COMMON_b8c8bae1', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 20:28:04', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('b4c4f0b04b1e44fbcf10bc751bbd9ccc', '团队所有者', 'fcc39073_ADMIN', NULL, '2', NULL, '0', NULL, '0', '2022-10-29 12:22:38', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('b561695689e7947ab578009f9bbc1660', '团队管理员', '70d096d5_1', NULL, '2', NULL, '0', NULL, '0', '2022-11-11 14:52:09', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_role` VALUES ('b66588a8aedcc0f9402db97b1dd346cb', '团队管理员', 'ba8e92d8_1', NULL, '2', NULL, '0', NULL, '0', '2023-03-25 20:22:14', NULL, 'admin8', NULL);
INSERT INTO `sys_role` VALUES ('bb405adcacaa81c1cb85e1c1069fb866', 'COMMON', 'COMMON_dd48c44f', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 20:31:50', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('bde4a9cc60589765b1e1d9c27efb9948', '团队普通成员', '99f5b879_2', NULL, '2', NULL, '0', NULL, '0', '2022-11-18 21:59:53', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_role` VALUES ('bfbd88875d79ffc36acb6185da8fd3e0', 'MANAGER', 'MANAGER_b8c8bae1', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 20:28:04', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('c0dacd4f75918c098163816542631722', 'ADMIN', 'ADMIN_1808718025', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 20:17:54', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('c242937f33dc2db02ee91093d22b6065', 'ADMIN', 'ADMIN_89a76a3b', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 20:25:50', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('c6ada724c77d6c60355427489bb1d3ca', '团队管理员', 'fcc39073_MANAGER', NULL, '2', NULL, '0', NULL, '0', '2022-10-29 12:22:38', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('c6c8e3dcee5bee5b3fcf795fe144891f', 'ADMIN', 'ADMIN_b8c8bae1', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 20:28:04', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('c703e1e54dfa9ecc56e3482aecca6984', '团队管理员', '5778ac5c_1', NULL, '2', NULL, '0', NULL, '0', '2022-11-12 11:51:12', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_role` VALUES ('ca67ea40617c8819a40e9fa46f202635', '团队所有者', '5778ac5c_0', NULL, '2', NULL, '0', NULL, '0', '2022-11-12 11:51:12', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_role` VALUES ('caeb786684442ea62204532067e395b3', '团队管理员', 'bf194caf_1', NULL, '2', NULL, '0', NULL, '0', '2022-11-11 20:47:17', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_role` VALUES ('caeda5937c0e9701f42bd2f7b913eba3', 'ADMIN', 'ADMIN_3af6bd8a', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 20:23:40', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('cb64900b4a6b6795ad40ed97500c435b', '团队所有者', '47d4f93c_ADMIN', NULL, '2', NULL, '0', NULL, '0', '2022-10-28 21:55:31', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('ccc98c07b719c4614855741186a38d26', '团队普通成员', 'ba8e92d8_2', NULL, '2', NULL, '0', NULL, '0', '2023-03-25 20:22:14', NULL, 'admin8', NULL);
INSERT INTO `sys_role` VALUES ('d051d250de0d41551cf594706d9a0445', 'MANAGER', 'MANAGER_3af6bd8a', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 20:23:40', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('d2295a3f67461444b311d874e23bb82a', '团队普通成员', '812d4dae_2', NULL, '2', NULL, '0', NULL, '0', '2022-11-11 12:54:07', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_role` VALUES ('d88628e6231cc8f2ffec1da16e3103b2', '团队所有者', '7e001c87_0', NULL, '2', NULL, '0', NULL, '0', '2022-11-11 23:41:25', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_role` VALUES ('daaef9ef920982a31e8fedb960a5da2f', '团队所有者', '713a5995_0', NULL, '2', NULL, '0', NULL, '0', '2022-10-29 12:28:13', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('db0719b8ff3eec1077f5f04aecc7aa57', '团队所有者', '77de468a_0', NULL, '2', NULL, '0', NULL, '0', '2022-11-11 20:45:02', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_role` VALUES ('e6afb6338a488f62f569707334b08e9e', '团队所有者', '3a489281_0', NULL, '2', NULL, '0', NULL, '0', '2023-04-13 21:54:07', NULL, 'admin7', NULL);
INSERT INTO `sys_role` VALUES ('f2654caa86346e2828c5151a8f4e1075', '团队普通成员', '010fce99_COMMON', NULL, '2', NULL, '0', NULL, '0', '2022-10-29 12:19:30', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('f3a61e2e70be99ed3abbf4a9aa259f7e', '团队普通成员', '77de468a_2', NULL, '2', NULL, '0', NULL, '0', '2022-11-11 20:45:02', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_role` VALUES ('f9275f1342d6f983e9f56a02f5676797', '团队管理员', '812d4dae_1', NULL, '2', NULL, '0', NULL, '0', '2022-11-11 12:54:07', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_role` VALUES ('faad43a531b1cb59553b6d0dee4d3f41', '团队管理员', '6cd44fa2_MANAGER', NULL, '2', NULL, '0', NULL, '0', '2022-10-22 22:02:47', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('ff48340bff93b8c75b1d53d791ea8fd2', '团队普通成员', 'fcc39073_COMMON', NULL, '2', NULL, '0', NULL, '0', '2022-10-29 12:22:38', NULL, '2', NULL);
INSERT INTO `sys_role` VALUES ('ff4ea4bc28bb3709177562e19049e86b', '团队管理员', 'b0634f19_1', NULL, '2', NULL, '0', NULL, '0', '2023-01-08 10:30:58', NULL, 'admin7', NULL);
COMMIT;

-- ----------------------------
-- Table structure for sys_role_privilege
-- ----------------------------
DROP TABLE IF EXISTS `sys_role_privilege`;
CREATE TABLE `sys_role_privilege` (
  `id` varchar(45) NOT NULL COMMENT '主键',
  `role_id` varchar(45) NOT NULL COMMENT '角色id',
  `resource_id` varchar(45) DEFAULT NULL COMMENT '资源id',
  `dict_id` varchar(45) DEFAULT NULL COMMENT '权限类型',
  `tenant_id` varchar(45) DEFAULT '0' COMMENT '所属租户',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '修改时间',
  `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
  `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE,
  KEY `fk_sys_role_has_sys_privilege_sys_role1_idx` (`role_id`) USING BTREE,
  KEY `sys_role_privilege_dict_id_index` (`dict_id`) USING BTREE,
  KEY `sys_role_privilege_resource_id_index` (`resource_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统角色权限关系--废弃';

-- ----------------------------
-- Records of sys_role_privilege
-- ----------------------------
BEGIN;
INSERT INTO `sys_role_privilege` VALUES ('10', '1', '1', NULL, NULL, '0', '2020-09-01 18:40:46', NULL, '2', '2');
INSERT INTO `sys_role_privilege` VALUES ('11', '1', '134', NULL, NULL, '0', '2020-09-01 18:45:58', NULL, '2', '2');
INSERT INTO `sys_role_privilege` VALUES ('12', '1', '135', NULL, NULL, '0', '2020-09-01 18:45:58', NULL, '2', '2');
INSERT INTO `sys_role_privilege` VALUES ('13', '1', '1', NULL, NULL, '0', '2020-09-01 18:45:58', NULL, '2', '2');
INSERT INTO `sys_role_privilege` VALUES ('14', '1', '134', NULL, NULL, '0', '2020-09-01 18:47:27', NULL, '2', '2');
INSERT INTO `sys_role_privilege` VALUES ('15', '1', '135', NULL, NULL, '0', '2020-09-01 18:47:27', NULL, '2', '2');
INSERT INTO `sys_role_privilege` VALUES ('16', '1', '1', NULL, NULL, '0', '2020-09-01 18:47:27', NULL, '2', '2');
INSERT INTO `sys_role_privilege` VALUES ('17', '1', '134', '1', NULL, '0', '2020-09-02 10:07:09', NULL, '2', '2');
INSERT INTO `sys_role_privilege` VALUES ('18', '1', '135', '1', NULL, '0', '2020-09-02 10:07:09', NULL, '2', '2');
INSERT INTO `sys_role_privilege` VALUES ('19', '1', '1', '1', NULL, '0', '2020-09-02 10:07:09', NULL, '2', '2');
INSERT INTO `sys_role_privilege` VALUES ('4', '1', '134', NULL, NULL, '0', '2020-09-01 18:25:43', NULL, '2', '2');
INSERT INTO `sys_role_privilege` VALUES ('5', '1', '134', NULL, NULL, '0', '2020-09-01 18:28:04', NULL, '2', '2');
INSERT INTO `sys_role_privilege` VALUES ('6', '1', '134', NULL, NULL, '0', '2020-09-01 18:28:18', NULL, '2', '2');
INSERT INTO `sys_role_privilege` VALUES ('7', '1', '134', NULL, NULL, '0', '2020-09-01 18:28:19', NULL, '2', '2');
INSERT INTO `sys_role_privilege` VALUES ('8', '1', '134', NULL, NULL, '0', '2020-09-01 18:40:46', NULL, '2', '2');
INSERT INTO `sys_role_privilege` VALUES ('9', '1', '135', NULL, NULL, '0', '2020-09-01 18:40:46', NULL, '2', '2');
COMMIT;

-- ----------------------------
-- Table structure for sys_social_details
-- ----------------------------
DROP TABLE IF EXISTS `sys_social_details`;
CREATE TABLE `sys_social_details` (
  `id` varchar(45) NOT NULL COMMENT '主鍵',
  `type` varchar(16) NOT NULL COMMENT '类型',
  `remark` varchar(64) DEFAULT NULL COMMENT '描述',
  `app_id` varchar(64) NOT NULL COMMENT 'appid',
  `app_secret` varchar(64) NOT NULL COMMENT 'app_secret',
  `redirect_url` varchar(128) DEFAULT NULL COMMENT '回调地址',
  `tenant_id` varchar(45) NOT NULL DEFAULT '0' COMMENT '所属租户',
  `del_flag` char(1) NOT NULL DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
  `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统社交账号';

-- ----------------------------
-- Records of sys_social_details
-- ----------------------------
BEGIN;
COMMIT;

-- ----------------------------
-- Table structure for sys_user
-- ----------------------------
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user` (
  `id` varchar(45) NOT NULL COMMENT '主键',
  `name` varchar(50) DEFAULT NULL COMMENT '姓名',
  `username` varchar(64) NOT NULL COMMENT '用户名',
  `nickname` varchar(100) DEFAULT NULL COMMENT '昵称',
  `gender` char(1) DEFAULT NULL COMMENT '性别',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像',
  `blog` varchar(255) DEFAULT NULL COMMENT '博客',
  `company` varchar(64) DEFAULT NULL COMMENT '公司',
  `location` varchar(255) DEFAULT NULL COMMENT '地址',
  `email` varchar(50) DEFAULT NULL COMMENT '邮箱',
  `pwd` varchar(255) NOT NULL COMMENT '密码',
  `salt` varchar(255) DEFAULT NULL COMMENT '随机盐',
  `age` int DEFAULT NULL COMMENT '年纪',
  `signature` varchar(100) DEFAULT NULL COMMENT '签名',
  `title` varchar(45) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT '全球第一个开源在线数据库建模平台' COMMENT '头衔',
  `classification` varchar(100) DEFAULT NULL COMMENT '分类',
  `phone` varchar(20) DEFAULT NULL COMMENT '电话',
  `dept_id` varchar(45) DEFAULT NULL COMMENT '部门ID',
  `wechat_openid` varchar(32) DEFAULT NULL COMMENT '微信openid',
  `qq_openid` varchar(32) DEFAULT NULL COMMENT 'QQ openid',
  `tenant_id` varchar(45) NOT NULL DEFAULT '0' COMMENT '所属租户',
  `lock_flag` char(1) DEFAULT '0' COMMENT '0-正常，9-锁定',
  `del_flag` char(1) DEFAULT '0' COMMENT '删除标识（0-正常,1-删除）',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '修改时间',
  `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
  `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `username_UNIQUE` (`username`) USING BTREE,
  KEY `user_wx_openid` (`wechat_openid`) USING BTREE,
  KEY `user_qq_openid` (`qq_openid`) USING BTREE,
  KEY `user_idx1_username` (`username`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统用户';

-- ----------------------------
-- Records of sys_user
-- ----------------------------
BEGIN;
INSERT INTO `sys_user` VALUES ('2', NULL, 'admin', NULL, NULL, '', NULL, NULL, '北京市海淀区双清路30号', 'martincloud@martin.com', '{bcrypt}$2a$10$vAxxCnKsa0MLdCLoP9A2UOsBMdsVLOaodDIezhtyFhkLdLilo6Mce', '1', 28, '多多支持，点点star', '一站式微服务专家', '专家', '0010-8888888', '1', 'oDOGms-6yCnGrRovBj2yHij5JL6E', 'oDOGms-6yCnGrRovBj2yHij5JL6E', '0', '0', '0', '2019-09-18 15:01:37', '2021-05-10 16:40:53', '2', '2');
COMMIT;

-- ----------------------------
-- Table structure for sys_user_role
-- ----------------------------
DROP TABLE IF EXISTS `sys_user_role`;
CREATE TABLE `sys_user_role` (
  `id` varchar(45) NOT NULL COMMENT '主键',
  `user_id` varchar(45) NOT NULL COMMENT '用户id',
  `role_id` varchar(45) NOT NULL COMMENT '角色id',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` timestamp NULL DEFAULT NULL COMMENT '修改时间',
  `creator` varchar(45) DEFAULT NULL COMMENT '创建人',
  `updater` varchar(45) DEFAULT NULL COMMENT '修改人',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `sys_user_role_pk` (`user_id`,`role_id`) USING BTREE,
  KEY `fk_sys_user_has_sys_role_sys_role1_idx` (`role_id`) USING BTREE,
  KEY `fk_sys_user_has_sys_role_sys_user_idx` (`user_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC COMMENT='系统用户角色关系';

-- ----------------------------
-- Records of sys_user_role
-- ----------------------------
BEGIN;
INSERT INTO `sys_user_role` VALUES ('03584855fb1f689fd44906471277db25', 'df53e30d2f844f94876c4442fdfa3995', '8', '2021-08-06 23:06:29', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('0e1fb27aecd74d699dfd77051cba0557', '0216bb2bc38741488d67f33900c6abc0', '8', '2022-05-04 03:55:39', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('0fa7454538582160537ab71e24251a08', 'cb0f3b9def006cc50e9d5959b18dfa0a', '1254efa4f511f023a1813a935ee0b4cb', '2023-07-09 16:48:04', NULL, 'admin8', NULL);
INSERT INTO `sys_user_role` VALUES ('100024597134442496', '99954289073455104', 'f2654caa86346e2828c5151a8f4e1075', '2022-10-29 12:19:54', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('100024597134442497', '99954289073455105', 'f2654caa86346e2828c5151a8f4e1075', '2022-10-29 12:19:54', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('100024597134442498', '99954289073455106', '6ef2b49a60501969a313808b9b566a27', '2022-10-29 12:20:01', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('100024597134442499', '99954289073455107', '6ef2b49a60501969a313808b9b566a27', '2022-10-29 12:20:01', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('100024597134442525', 'df53e30d2f844f94876c4442fdfa3995', '100024597134442524', '2022-10-29 22:00:24', NULL, '2', NULL);
INSERT INTO `sys_user_role` VALUES ('100024597134442526', 'aa7fad19fe122bf7cd3862b3141026c3', '100024597134442524', '2022-10-29 22:03:41', NULL, '2', NULL);
INSERT INTO `sys_user_role` VALUES ('100024597134442532', 'ee1043d614750f4dec3ad1192c95533f', '100024597134442524', '2022-10-29 23:21:34', NULL, '2', NULL);
INSERT INTO `sys_user_role` VALUES ('100030513200234870', 'cb0f3b9def006cc50e9d5959b18dfa0a', '100024597134442524', '2022-11-11 12:52:38', NULL, '2', NULL);
INSERT INTO `sys_user_role` VALUES ('100030513200234962', 'ee1043d614750f4dec3ad1192c95533f', 'f9275f1342d6f983e9f56a02f5676797', '2022-11-11 12:59:35', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('100030513200235521', 'ee1043d614750f4dec3ad1192c95533f', 'abec132ecbf942a9a96faf176fa306b6', '2022-11-11 23:44:53', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('100030513200235707', 'ee1043d614750f4dec3ad1192c95533f', 'c703e1e54dfa9ecc56e3482aecca6984', '2022-11-12 12:08:56', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('100030513200235985', 'c7057b307164b38a89a89f9cc41f8388', '14b74eb0668ecda5c5a2c57cb0b38884', '2022-11-14 14:59:09', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('100030513200236076', 'cb0f3b9def006cc50e9d5959b18dfa0a', '8b5069b4beaf6bfbd6c0a8ca168f4bfb', '2022-11-14 16:15:09', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('100116040125513730', 'cb0f3b9def006cc50e9d5959b18dfa0a', 'bde4a9cc60589765b1e1d9c27efb9948', '2023-01-02 00:18:53', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('100127057991696471', 'cb0f3b9def006cc50e9d5959b18dfa0a', 'ff4ea4bc28bb3709177562e19049e86b', '2023-01-08 10:46:38', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('100127057991696560', 'cb0f3b9def006cc50e9d5959b18dfa0a', '0a156c44815ce17f3ca23a2096f853e0', '2023-01-08 15:44:29', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('100485588339130368', '51fa6955d0332698bc681fc4730d57c1', '100024597134442524', '2023-10-05 11:34:22', NULL, '2', NULL);
INSERT INTO `sys_user_role` VALUES ('100485588339130369', 'c468451132cc9b0ed28b6dbb39213b0a', '100024597134442524', '2023-10-05 16:32:06', NULL, '2', NULL);
INSERT INTO `sys_user_role` VALUES ('100485588339130370', 'f9a576469c25d184ae5b9b0935cc30b9', '100024597134442524', '2023-10-05 16:32:43', NULL, '2', NULL);
INSERT INTO `sys_user_role` VALUES ('100485588339130371', '1b0f78348e66036f5b47acaba8575c86', '100024597134442524', '2023-10-05 16:38:54', NULL, '2', NULL);
INSERT INTO `sys_user_role` VALUES ('100485588339130372', '709ef5f93f05f12778a924146d5bb729', '100024597134442524', '2023-10-05 16:39:38', NULL, '2', NULL);
INSERT INTO `sys_user_role` VALUES ('100485588339130373', '8a920561f56aa2ec6a5a39dca3e8a4b8', '100024597134442524', '2023-10-06 10:01:35', NULL, '2', NULL);
INSERT INTO `sys_user_role` VALUES ('100485588339130374', '89de8384a1ab6b367fa991e3096c84d5', '100024597134442524', '2023-10-06 10:17:00', NULL, '2', NULL);
INSERT INTO `sys_user_role` VALUES ('100485588339130375', '1d27bb7fbe395f203052d161020dec45', '100024597134442524', '2023-10-06 10:26:12', NULL, '2', NULL);
INSERT INTO `sys_user_role` VALUES ('1ff2e2b5080b91b4137df0e2f019eb61', 'ee1043d614750f4dec3ad1192c95533f', '5d9eabb72a12bf7898c8c812bcfff6a2', '2023-01-08 18:30:58', NULL, 'admin7', NULL);
INSERT INTO `sys_user_role` VALUES ('2736aa31e46c64078f76a0eec598dcab', '93d0b4a6ee664a3c8089735d3cb5ed31', '8', '2022-05-04 03:35:45', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('27d906f9e2ef891e5ddecee86ea3b2e3', '2', '2bffcc5fd5c51b257a3cc6cb610bf1ad', '2022-10-29 20:19:30', NULL, '2', NULL);
INSERT INTO `sys_user_role` VALUES ('35', '2', '1', '2021-07-19 02:01:07', NULL, '2', NULL);
INSERT INTO `sys_user_role` VALUES ('4db2eb3a27be1b34d5c4c6378f54af81', 'cb0f3b9def006cc50e9d5959b18dfa0a', '923498fd965fe23d33621dfb6f58ce1a', '2023-03-26 05:38:35', NULL, 'admin8', NULL);
INSERT INTO `sys_user_role` VALUES ('4f54d3cfc622de0c6da885af1bd8b4da', 'ee1043d614750f4dec3ad1192c95533f', '56e52e62cbb6e9574cba7d54139c45f2', '2022-11-11 22:52:09', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_user_role` VALUES ('51', '3', '1', '2021-07-19 02:19:25', NULL, '2', NULL);
INSERT INTO `sys_user_role` VALUES ('53', '1', '1', '2021-08-06 01:54:53', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('55', '1', '8', '2021-08-06 19:45:17', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('5686831466ef244ae032203921a143e7', 'ee1043d614750f4dec3ad1192c95533f', '186a114853766c6b8137fc5159a33076', '2023-01-08 23:44:15', NULL, 'admin7', NULL);
INSERT INTO `sys_user_role` VALUES ('5766a86b718c72d60117239dcdf07e56', 'cb0f3b9def006cc50e9d5959b18dfa0a', 'd88628e6231cc8f2ffec1da16e3103b2', '2022-11-12 07:41:25', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_user_role` VALUES ('5a6d3b67000f34c637be8889eb6c455d', 'cb0f3b9def006cc50e9d5959b18dfa0a', '3345e9d0fbf6a6e3fa771596e0baa7ce', '2022-11-12 07:40:11', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_user_role` VALUES ('6999fc4a8f36bdfb137f5bea397908f8', 'cb0f3b9def006cc50e9d5959b18dfa0a', '89c6ca4480d3e414de7a0ccafe58a7b0', '2023-03-26 04:22:14', NULL, 'admin8', NULL);
INSERT INTO `sys_user_role` VALUES ('6bcfb2ef8893232d591d117f4a446691', 'ee1043d614750f4dec3ad1192c95533f', 'db0719b8ff3eec1077f5f04aecc7aa57', '2022-11-12 04:45:02', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_user_role` VALUES ('6df292ec925b7776794eea4e3fbef87a', '7ccf9b281c3840fe8dd4280fb56b8b97', '8', '2022-05-04 03:32:57', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('70c9306e17fc3d8bbbed886d7be68cb3', '7817327eb35c4d9da18328c852f8a30c', '8', '2022-05-04 03:37:44', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('769bd0d165c626b1384e2812dadb485d', 'ee1043d614750f4dec3ad1192c95533f', '4723db1a59e91bc6a3843b5159cb6c09', '2022-10-30 07:22:01', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_user_role` VALUES ('7a67a170b3c60b1dc11b964632df4207', 'f8100f159b5945f7a340c12c6d5887a9', '8', '2022-05-04 03:28:04', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('83c783221a67c72777f8cf36476bbc3c', '7f425ed1032b4e9ba843355d97b252dd', '8', '2021-08-07 00:15:54', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('8d8e95a476fda7e22dc3fd6800e1c773', 'edce0908d1904c189f8ea6b378b43a1d', '8', '2022-05-04 03:28:55', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('99954289073455112', '99954289073455104', '1b850e5d9ffc9c4e5b6bb363e835a204', '2022-05-04 03:30:53', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('99954289073455113', '99954289073455105', '1b850e5d9ffc9c4e5b6bb363e835a204', '2022-05-04 03:30:53', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('99954289073455116', '99954289073455107', '0a47abd49eb027254365ae95b561c5d9', '2022-10-28 15:25:07', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('99954289073455117', '99954289073455106', '0a47abd49eb027254365ae95b561c5d9', '2022-10-28 15:26:59', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('99954289073455119', '99954289073455106', '1b850e5d9ffc9c4e5b6bb363e835a204', '2022-10-28 16:44:48', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('99954289073455125', '99954289073455108', 'faad43a531b1cb59553b6d0dee4d3f41', '2022-10-28 17:34:32', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('9a54ac1d5cd6bf291fd0232950882d7a', 'cb0f3b9def006cc50e9d5959b18dfa0a', 'ca67ea40617c8819a40e9fa46f202635', '2022-11-12 19:51:12', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_user_role` VALUES ('aa1a0b8fddc0d59a870ca53ada8a631d', 'ee1043d614750f4dec3ad1192c95533f', '8fd2a2595b94a76001bc12588f4ae974', '2022-11-14 23:47:44', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_user_role` VALUES ('ad2846ac8d42a302ce5d02a1603e3f7d', 'cb0f3b9def006cc50e9d5959b18dfa0a', '00e9a957636db103cbb027f80dcb5ede', '2022-11-12 04:47:17', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_user_role` VALUES ('b05ac9dd925a3b8d937d3e39510ccbfd', '8ccb4614ecad4c63a5503cdab79e4163', '8', '2022-05-04 03:31:59', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('b1535237a46ac2125e49ef9978a6c411', 'cb0f3b9def006cc50e9d5959b18dfa0a', '1f709d16b5070a02ccfa657f5342afbd', '2022-11-11 20:54:07', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_user_role` VALUES ('d110d9a0677ffce189b70b574d6cee0f', '2', 'daaef9ef920982a31e8fedb960a5da2f', '2022-10-29 20:28:13', NULL, '2', NULL);
INSERT INTO `sys_user_role` VALUES ('d134823c9fddfb80fd645505d1f1c6e1', 'c70da03bf1c74146b0bff09d61769d0b', '8', '2022-05-04 03:54:32', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('d36dafa220ef9f53c3233cf0bd368797', 'ee1043d614750f4dec3ad1192c95533f', '65f689074ea14bc86db02f9fb897d6cf', '2022-11-12 04:46:51', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_user_role` VALUES ('da5fb88cbfe3dfdb7c334eee8782e906', 'ee1043d614750f4dec3ad1192c95533f', '74d710a687b15914e2f80f5b0502ef47', '2022-11-19 05:59:53', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
INSERT INTO `sys_user_role` VALUES ('dceabf87f087a5650ef61c1f107eb051', '2baa3a550597466eb6c169df0c0e5356', '8', '2022-05-04 03:25:16', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('eb6b1f3f6a37ba86ee21dbeb7fee1015', '2', 'b4c4f0b04b1e44fbcf10bc751bbd9ccc', '2022-10-29 20:22:38', NULL, '2', NULL);
INSERT INTO `sys_user_role` VALUES ('f0adf70a7533518674834d10f71372ab', 'cb0f3b9def006cc50e9d5959b18dfa0a', '2fecd4b38156b0b884c13771bdbf30d3', '2022-11-12 19:47:12', NULL, 'cb0f3b9def006cc50e9d5959b18dfa0a', NULL);
INSERT INTO `sys_user_role` VALUES ('f32cd93a7c4f8424478d8e9ca5522d16', 'ee1043d614750f4dec3ad1192c95533f', 'e6afb6338a488f62f569707334b08e9e', '2023-04-14 05:54:07', NULL, 'admin7', NULL);
INSERT INTO `sys_user_role` VALUES ('f89b94fed94f26ef89e8c1dfe404129a', '39bf4ef1d6154cd3ac49e324fb7e7f7e', '8', '2022-05-04 03:30:53', NULL, NULL, NULL);
INSERT INTO `sys_user_role` VALUES ('fd46924da1f3cb3563ce136506da1a02', 'ee1043d614750f4dec3ad1192c95533f', '058b1e9d65489c064f6a0a644bc9a1fc', '2022-11-16 03:19:28', NULL, 'ee1043d614750f4dec3ad1192c95533f', NULL);
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
