#!/usr/bin/env bash
# Per-boot reconciliation: bring up Redis + MySQL. Idempotent; returns once ready.
set -euo pipefail

echo "==> Redis"
redis-cli ping >/dev/null 2>&1 || redis-server --daemonize yes --save '' --appendonly no

echo "==> MySQL"
# /run is tmpfs and cleared on each boot; recreate the MySQL socket/pid dir.
sudo install -d -m 0755 -o mysql -g mysql /var/run/mysqld
if ! sudo mysqladmin ping >/dev/null 2>&1; then
  # Drop any stale pid file captured in the base image before (re)starting.
  sudo rm -f /var/lib/mysql/*.pid 2>/dev/null || true
  sudo bash -c 'nohup mysqld_safe --user=mysql >/tmp/mysqld.log 2>&1 &'
fi
for _ in $(seq 1 60); do sudo mysqladmin ping >/dev/null 2>&1 && break; sleep 1; done
sudo mysqladmin ping >/dev/null 2>&1 || {
  echo "MySQL failed to start"; sudo tail -30 /tmp/mysqld.log
  sudo tail -40 /var/log/mysql/error.log 2>/dev/null || true; exit 1
}

echo "==> Infra ready (Redis:6379, MySQL:3306)"
