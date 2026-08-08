#!/usr/bin/env bash
# Shared native-MySQL bring-up for the ERD Online Cloud Agent environment.
#
# There is no systemd in the VM, so MySQL is run as a plain managed process.
# The datadir baked into a prebuilt environment build can be an *unclean* copy
# (captured while mysqld was live), which aborts startup. These helpers are
# therefore self-healing: if the existing datadir will not start, they wipe and
# reinitialize a fresh one, then always (re)provision the `erd` DB, user and the
# schema-only base tables. Flyway (ErdFlywayConfig) applies the rest on boot.
#
# Callers must export ERD_REPO_ROOT before sourcing helpers that read db/init.

ERD_MYSQL_DATADIR="${ERD_MYSQL_DATADIR:-/var/lib/mysql}"

_erd_mysql_launch() {
  sudo install -d -m 0755 -o mysql -g mysql /var/run/mysqld
  sudo rm -f /var/run/mysqld/*.pid "$ERD_MYSQL_DATADIR"/*.pid 2>/dev/null || true
  # Direct mysqld (reads /etc/mysql defaults: 127.0.0.1:3306 + socket + error.log).
  # Avoiding mysqld_safe means no uncontrollable auto-restart loop.
  sudo -u mysql bash -c 'nohup /usr/sbin/mysqld --user=mysql >/tmp/mysqld.out 2>&1 & echo $! >/tmp/erd-mysqld.pid'
}

_erd_mysql_wait() {
  local tries="${1:-30}"
  local i=0
  while [ "$i" -lt "$tries" ]; do
    sudo mysqladmin ping >/dev/null 2>&1 && return 0
    i=$((i + 1)); sleep 1
  done
  return 1
}

erd_mysql_stop() {
  sudo mysqladmin shutdown >/dev/null 2>&1 || true
  [ -f /tmp/erd-mysqld.pid ] && sudo kill "$(cat /tmp/erd-mysqld.pid)" 2>/dev/null || true
  local i=0
  while [ "$i" -lt 20 ]; do
    sudo mysqladmin ping >/dev/null 2>&1 || return 0
    i=$((i + 1)); sleep 1
  done
}

# Bring mysqld up; reinitialize a fresh datadir if the existing one cannot start.
erd_mysql_up() {
  sudo install -d -m 0755 -o mysql -g mysql /var/run/mysqld
  sudo mysqladmin ping >/dev/null 2>&1 && return 0

  _erd_mysql_launch
  _erd_mysql_wait 30 && return 0

  echo "MySQL did not start on existing datadir; reinitializing a fresh one" >&2
  sudo tail -20 /var/log/mysql/error.log 2>/dev/null || true
  erd_mysql_stop
  sudo rm -rf "$ERD_MYSQL_DATADIR"
  sudo install -d -m 0750 -o mysql -g mysql "$ERD_MYSQL_DATADIR"
  sudo -u mysql /usr/sbin/mysqld --initialize-insecure --user=mysql --datadir="$ERD_MYSQL_DATADIR"
  _erd_mysql_launch
  _erd_mysql_wait 40 && return 0

  echo "MySQL failed to start after reinitialization" >&2
  sudo tail -40 /var/log/mysql/error.log 2>/dev/null || true
  sudo tail -20 /tmp/mysqld.out 2>/dev/null || true
  return 1
}

# Ensure the erd database, user and schema-only base tables exist (idempotent).
erd_mysql_provision() {
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
  local has_base
  has_base=$(sudo mysql -N -B -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='erd' AND table_name='oauth_client_details';")
  if [ "$has_base" = "0" ]; then
    echo "    loading base schema (db/init/02_tables.sql)"
    sudo mysql erd < "${ERD_REPO_ROOT:?ERD_REPO_ROOT not set}/db/init/02_tables.sql"
  else
    echo "    base schema already present"
  fi
}

# Convenience: up + provision.
erd_mysql_ensure() { erd_mysql_up && erd_mysql_provision; }
