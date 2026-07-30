#!/usr/bin/env bash
# 构建后端 jar 与前端 dist 产物
# Usage: ./scripts/build.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> 构建后端 jar"
( cd backend && mvn clean package -DskipTests )

echo "==> 构建前端 dist"
( cd frontend && yarn && yarn build )

echo "==> 完成"
echo "    后端: backend/target/*.jar"
echo "    前端: frontend/dist/"
