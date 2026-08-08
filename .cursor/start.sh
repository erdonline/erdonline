#!/usr/bin/env bash
# Per-boot reconciliation: bring up Redis + MySQL. Idempotent; returns once ready.
set -euo pipefail

export ERD_REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=.cursor/lib-mysql.sh
source "$ERD_REPO_ROOT/.cursor/lib-mysql.sh"

echo "==> Redis"
redis-cli ping >/dev/null 2>&1 || redis-server --daemonize yes --save '' --appendonly no

echo "==> MySQL (self-healing datadir + provision)"
erd_mysql_ensure

echo "==> Infra ready (Redis:6379, MySQL:3306)"
