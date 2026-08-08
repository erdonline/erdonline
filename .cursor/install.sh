#!/usr/bin/env bash
# Idempotent Cloud Agent setup for ERD Online (backend + frontend + MySQL + Redis).
# Runs after checkout. Safe to run repeatedly. See docs/development.md.
set -euo pipefail

export ERD_REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ERD_REPO_ROOT"
# shellcheck source=.cursor/lib-mysql.sh
source "$ERD_REPO_ROOT/.cursor/lib-mysql.sh"

JAVA17="/usr/lib/jvm/java-17-openjdk-amd64"

echo "==> [1/5] System packages (maven, jdk17, mysql-server, redis-server)"
if ! command -v mysqld >/dev/null 2>&1 || ! command -v mvn >/dev/null 2>&1 || [ ! -d "$JAVA17" ]; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    maven openjdk-17-jdk-headless mysql-server redis-server
fi

echo "==> [2/5] Start Redis + MySQL (self-healing datadir)"
redis-cli ping >/dev/null 2>&1 || redis-server --daemonize yes --save '' --appendonly no
erd_mysql_up

echo "==> [3/5] Provision erd database + user + base schema"
erd_mysql_provision

echo "==> [4/5] Backend: compile + export runtime classpath (JDK17)"
export JAVA_HOME="$JAVA17"
( cd backend && mvn -q -DskipTests compile )
( cd backend && mvn -q dependency:build-classpath -Dmdep.outputFile=target/cp.txt )

echo "==> [5/5] Frontend: yarn install"
( cd frontend && yarn install --frozen-lockfile )

# Leave MySQL cleanly stopped so a prebuilt environment build snapshots a
# consistent datadir (an unclean copy would fail to start on the next boot).
echo "==> Stopping MySQL for a clean snapshot state"
erd_mysql_stop

echo "==> install.sh complete"
