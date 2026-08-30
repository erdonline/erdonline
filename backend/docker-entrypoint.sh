#!/bin/sh
# Railway / Docker: Node MCP HTTP sidecar + Spring Boot on one public PORT.
# MCP tools reuse mcp/dist (14 tools → loopback /api/v1 + Bearer PAT from client).
set -e

PORT="${PORT:-9502}"
MCP_PORT="${ERD_MCP_INTERNAL_PORT:-3920}"
MCP_DIR="/app/mcp"

start_mcp_sidecar() {
  if [ ! -f "${MCP_DIR}/dist/index.js" ]; then
    echo "MCP sidecar missing ${MCP_DIR}/dist/index.js" >&2
    return 1
  fi
  export ERD_MCP_TRANSPORT=http
  export ERD_MCP_PORT="${MCP_PORT}"
  export ERD_API_URL="http://127.0.0.1:${PORT}"
  unset ERD_PAT ERD_API_TOKEN
  node "${MCP_DIR}/dist/index.js" &
  MCP_PID=$!
  echo "MCP sidecar pid=${MCP_PID} port=${MCP_PORT} → ${ERD_API_URL}"
  i=0
  while [ "$i" -lt 30 ]; do
    code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${MCP_PORT}/mcp" 2>/dev/null || echo 000)"
    if [ "$code" = "405" ] || [ "$code" = "200" ]; then
      return 0
    fi
    i=$((i + 1))
    sleep 0.2
  done
  echo "MCP sidecar failed to bind ${MCP_PORT}" >&2
  return 1
}

if [ "${ERD_MCP_HTTP_ENABLED:-true}" != "false" ]; then
  start_mcp_sidecar || exit 1
  trap 'kill "${MCP_PID:-}" 2>/dev/null || true' EXIT INT TERM
fi

exec java -jar /app/app.jar --server.port="${PORT}"
