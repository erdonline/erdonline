-- 逆向验证：索引 + 外键（PostgreSQL）
CREATE TABLE t_user (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(64) NOT NULL,
    email       VARCHAR(128),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uk_user_code ON t_user (code);
CREATE INDEX idx_user_email ON t_user (email);

CREATE TABLE t_order (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    amount      NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status      VARCHAR(32) NOT NULL DEFAULT 'NEW'
);

CREATE INDEX idx_order_user ON t_order (user_id);
ALTER TABLE t_order
    ADD CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES t_user (id);

COMMENT ON TABLE t_user IS '用户表';
COMMENT ON COLUMN t_user.id IS '主键';
COMMENT ON COLUMN t_user.code IS '用户编码';
COMMENT ON COLUMN t_user.email IS '邮箱';
COMMENT ON TABLE t_order IS '订单表';
COMMENT ON COLUMN t_order.user_id IS '用户外键';
COMMENT ON COLUMN t_order.amount IS '订单金额';

INSERT INTO t_user (code, email) VALUES ('u001', 'u001@example.com');
INSERT INTO t_order (user_id, amount, status) VALUES (1, 99.50, 'PAID');
