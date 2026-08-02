-- ERD Online：单一业务库（ADR-0020）
-- 空 data 卷首启由 MySQL docker-entrypoint 执行；Railway 用 scripts/railway-mysql-init.sh
CREATE DATABASE IF NOT EXISTS `erd` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
