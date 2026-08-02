-- 逆向验证：索引 + 外键 + MS_Description 注释（SQL Server / Azure SQL Edge）
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

EXEC sys.sp_addextendedproperty @name = N'MS_Description', @value = N'用户表',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N't_user';
EXEC sys.sp_addextendedproperty @name = N'MS_Description', @value = N'主键',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N't_user',
    @level2type = N'COLUMN', @level2name = N'id';
EXEC sys.sp_addextendedproperty @name = N'MS_Description', @value = N'用户编码',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N't_user',
    @level2type = N'COLUMN', @level2name = N'code';
EXEC sys.sp_addextendedproperty @name = N'MS_Description', @value = N'邮箱',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N't_user',
    @level2type = N'COLUMN', @level2name = N'email';
EXEC sys.sp_addextendedproperty @name = N'MS_Description', @value = N'订单表',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N't_order';
EXEC sys.sp_addextendedproperty @name = N'MS_Description', @value = N'用户外键',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N't_order',
    @level2type = N'COLUMN', @level2name = N'user_id';
EXEC sys.sp_addextendedproperty @name = N'MS_Description', @value = N'订单金额',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N't_order',
    @level2type = N'COLUMN', @level2name = N'amount';
GO

INSERT INTO dbo.t_user (code, email) VALUES (N'u001', N'u001@example.com');
INSERT INTO dbo.t_order (user_id, amount, status) VALUES (1, 99.50, N'PAID');
GO
