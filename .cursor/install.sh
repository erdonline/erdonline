#!/usr/bin/env bash
# Idempotent Cloud Agent setup for ERD Online (backend + frontend + MySQL + Redis).
# Runs after checkout. Safe to run repeatedly. See docs/development.md.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

JAVA17="/usr/lib/jvm/java-17-openjdk-amd64"

echo "==> [1/5] System packages (maven, jdk17, mysql-server, redis-server)"
if ! command -v mysqld >/dev/null 2>&1 || ! command -v mvn >/dev/null 2>&1 || [ ! -d "$JAVA17" ]; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    maven openjdk-17-jdk-headless mysql-server redis-server
fi

echo "==> [2/5] Start MySQL (no systemd; managed process) + Redis"
redis-cli ping >/dev/null 2>&1 || redis-server --daemonize yes --save '' --appendonly no
if ! sudo mysqladmin ping >/dev/null 2>&1; then
  sudo bash -c 'nohup mysqld_safe --user=mysql >/tmp/mysqld.log 2>&1 &'
fi
for _ in $(seq 1 60); do sudo mysqladmin ping >/dev/null 2>&1 && break; sleep 1; done
sudo mysqladmin ping >/dev/null 2>&1 || { echo "MySQL failed to start"; sudo tail -20 /tmp/mysqld.log; exit 1; }

echo "==> [3/5] Ensure erd database + user + base schema (idempotent)"
sudo mysql <<'SQL'
CREATE DATABASE IF NOT EXISTS `erd` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE USER IF NOT EXISTS 'erd'@'localhost'  IDENTIFIED WITH mysql_native_password BY 'erd';
CREATE USER IF NOT EXISTS 'erd'@'127.0.0.1'  IDENTIFIED WITH mysql_native_password BY 'erd';
CREATE USER IF NOT EXISTS 'erd'@'%'          IDENTIFIED WITH mysql_native_password BY 'erd';
GRANT ALL PRIVILEGES ON `erd`.* TO 'erd'@'localhost';
GRANT ALL PRIVILEGES ON `erd`.* TO 'erd'@'127.0.0.1';
GRANT ALL PRIVILEGES ON `erd`.* TO 'erd'@'%';
FLUSH PRIVILEGES;
SQL
# Load schema-only base tables once (Flyway later adds incremental schema + seeds on boot).
HAS_BASE=$(sudo mysql -N -B -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='erd' AND table_name='oauth_client_details';")
if [ "$HAS_BASE" = "0" ]; then
  echo "    loading db/init/02_tables.sql"
  sudo mysql erd < db/init/02_tables.sql
else
  echo "    base schema already present, skipping"
fi

echo "==> [4/5] Backend: compile + export runtime classpath (JDK17)"
export JAVA_HOME="$JAVA17"
( cd backend && mvn -q -DskipTests compile )
( cd backend && mvn -q dependency:build-classpath -Dmdep.outputFile=target/cp.txt )

echo "==> [5/5] Frontend: yarn install"
( cd frontend && yarn install --frozen-lockfile )

echo "==> install.sh complete"
