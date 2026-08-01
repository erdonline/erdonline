-- 逆向验证库（与业务 erd/martin 隔离；挂到 mysql 初始化或手工导入）
CREATE DATABASE IF NOT EXISTS reverse_demo DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE reverse_demo;

CREATE TABLE IF NOT EXISTS t_user (
    id          BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(64) NOT NULL,
    email       VARCHAR(128) NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_code (code),
    KEY idx_user_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS t_order (
    id          BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    amount      DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status      VARCHAR(32) NOT NULL DEFAULT 'NEW',
    KEY idx_order_user (user_id),
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES t_user (id)
) ENGINE=InnoDB;

INSERT INTO t_user (code, email)
SELECT 'u001', 'u001@example.com' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM t_user WHERE code = 'u001');

INSERT INTO t_order (user_id, amount, status)
SELECT 1, 99.50, 'PAID' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM t_order LIMIT 1);
