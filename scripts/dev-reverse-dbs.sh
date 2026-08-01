#!/usr/bin/env bash
# 拉起逆向验证库（PostgreSQL + SQL Server），并往本机 MySQL 灌 reverse_demo。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! colima status &>/dev/null; then
  echo "Colima 未运行。先：colima start --disk-image ~/Downloads/ubuntu-24.04-minimal-cloudimg-arm64-docker.raw.gz"
  exit 1
fi

if docker compose version &>/dev/null; then
  COMPOSE=(docker compose)
else
  COMPOSE=(docker-compose)
fi

echo "==> postgres + sqlserver (profile=reverse)"
"${COMPOSE[@]}" --profile reverse up -d postgres sqlserver

echo "==> MySQL reverse_demo fixture"
for _ in $(seq 1 30); do
  if docker exec erd-mysql mysqladmin ping -h127.0.0.1 -uroot -proot --silent 2>/dev/null; then
    break
  fi
  sleep 1
done
docker exec -i erd-mysql mysql -h127.0.0.1 -uroot -proot < db/reverse-fixtures/mysql/01_reverse_demo.sql
echo "MySQL reverse_demo OK"

echo "==> 等待 PostgreSQL healthy"
for _ in $(seq 1 40); do
  st=$("${COMPOSE[@]}" --profile reverse ps --format json 2>/dev/null | head -c 1 || true)
  if docker exec erd-postgres pg_isready -U reverse -d reverse_demo &>/dev/null; then
    echo "PostgreSQL OK"
    break
  fi
  sleep 2
done

echo "==> 等待 SQL Server 端口并灌种子"
for _ in $(seq 1 60); do
  if docker exec erd-sqlserver bash -c 'timeout 1 bash -c "</dev/tcp/127.0.0.1/1433"' &>/dev/null; then
    break
  fi
  sleep 3
done

# Edge 可能无 sqlcmd：用临时 mcr.microsoft.com/mssql-tools 客户端灌库
if docker exec erd-sqlserver test -x /opt/mssql-tools18/bin/sqlcmd 2>/dev/null; then
  docker exec erd-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'Reverse_Passw0rd' -C -i /fixtures/01_schema.sql
elif docker exec erd-sqlserver test -x /opt/mssql-tools/bin/sqlcmd 2>/dev/null; then
  docker exec erd-sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'Reverse_Passw0rd' -i /fixtures/01_schema.sql
else
  echo "使用 mssql-tools 容器灌种子…"
  docker run --rm --network container:erd-sqlserver \
    -v "$ROOT/db/reverse-fixtures/sqlserver:/fixtures:ro" \
    mcr.microsoft.com/mssql-tools \
    /opt/mssql-tools/bin/sqlcmd -S 127.0.0.1 -U sa -P 'Reverse_Passw0rd' -i /fixtures/01_schema.sql
fi
echo "SQL Server fixture OK"

"${COMPOSE[@]}" --profile reverse ps
cat <<'EOF'

连接信息（导入逆向 / curl 用）：
  MySQL:      jdbc:mysql://127.0.0.1:3306/reverse_demo  root/root
              driver=com.mysql.cj.jdbc.Driver
  PostgreSQL: jdbc:postgresql://127.0.0.1:5432/reverse_demo  reverse/reverse
              driver=org.postgresql.Driver  schema=public
  SQL Server: jdbc:sqlserver://127.0.0.1:1433;databaseName=master;encrypt=false;trustServerCertificate=true
              sa / Reverse_Passw0rd  driver=com.microsoft.sqlserver.jdbc.SQLServerDriver  schema=dbo
EOF
