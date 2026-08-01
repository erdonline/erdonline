-- 逆向验证：索引 + 外键（SQL Server / Azure SQL Edge）
IF OBJECT_ID('dbo.t_order', 'U') IS NOT NULL DROP TABLE dbo.t_order;
IF OBJECT_ID('dbo.t_user', 'U') IS NOT NULL DROP TABLE dbo.t_user;
GO

CREATE TABLE dbo.t_user (
    id          BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    code        NVARCHAR(64) NOT NULL,
    email       NVARCHAR(128) NULL,
    created_at  DATETIME2 NOT NULL CONSTRAINT df_user_created DEFAULT SYSUTCDATETIME()
);
GO

CREATE UNIQUE INDEX uk_user_code ON dbo.t_user (code);
CREATE INDEX idx_user_email ON dbo.t_user (email);
GO

CREATE TABLE dbo.t_order (
    id          BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    amount      DECIMAL(12, 2) NOT NULL CONSTRAINT df_order_amount DEFAULT 0,
    status      NVARCHAR(32) NOT NULL CONSTRAINT df_order_status DEFAULT N'NEW',
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES dbo.t_user (id)
);
GO

CREATE INDEX idx_order_user ON dbo.t_order (user_id);
GO

INSERT INTO dbo.t_user (code, email) VALUES (N'u001', N'u001@example.com');
INSERT INTO dbo.t_order (user_id, amount, status) VALUES (1, 99.50, N'PAID');
GO
