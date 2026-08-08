#!/usr/bin/env bash
# Backend dev runner (Spring Boot, profile=dev, port 9502). Recompiles then runs
# from compiled classes for a fast, predictable start. Boot 3 requires JDK 17.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT/backend"

export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"

[ -f target/cp.txt ] || mvn -q dependency:build-classpath -Dmdep.outputFile=target/cp.txt
mvn -o -q compile

exec "$JAVA_HOME/bin/java" -cp "target/classes:$(cat target/cp.txt)" \
  -Dspring.profiles.active=dev com.erdonline.ErdOnlineApplication
