#!/usr/bin/env bash
# 本地开发一键启动：数据库(Docker) + 后端 + 前端
# Usage: ./scripts/dev.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> 启动 MySQL / Redis (Docker)"
docker compose up -d mysql redis

echo "==> 启动后端 (Spring Boot, :9502)"
( cd backend && mvn spring-boot:run ) &
BACKEND_PID=$!

echo "==> 启动前端 (Umi, :8000)"
( cd frontend && yarn && yarn start ) &
FRONTEND_PID=$!

trap 'echo "停止..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true' INT TERM
wait
