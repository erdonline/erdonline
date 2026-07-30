-- 业务库用户与授权（密码可通过环境变量在生产环境覆盖）
CREATE USER IF NOT EXISTS 'martin'@'%' IDENTIFIED BY 'martin';
GRANT ALL PRIVILEGES ON `martin`.* TO 'martin'@'%';
GRANT ALL PRIVILEGES ON `erd`.*    TO 'martin'@'%';

CREATE USER IF NOT EXISTS 'erd'@'%' IDENTIFIED BY 'erd';
GRANT ALL PRIVILEGES ON `erd`.*    TO 'erd'@'%';
GRANT ALL PRIVILEGES ON `martin`.* TO 'erd'@'%';

FLUSH PRIVILEGES;
