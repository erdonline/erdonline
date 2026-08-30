#!/usr/bin/env bash
# Project-level ERD Online MCP — Railway prod API, PAT from repo-root env files.
# PAT: ERD_PAT=erd_pat_… in .env or .env.local (gitignored); mint at Account settings.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

resolve_node() {
  if [[ -x "${HOME}/.nvm/versions/node/v22.22.0/bin/node" ]]; then
    echo "${HOME}/.nvm/versions/node/v22.22.0/bin/node"
  elif [[ -x /opt/homebrew/opt/node@22/bin/node ]]; then
    echo /opt/homebrew/opt/node@22/bin/node
  else
    echo "erdonline-mcp needs Node >= 18 (nvm v22.22.0 or Homebrew node@22)." >&2
    exit 1
  fi
}

# Load KEY=VALUE lines; strip optional quotes; ignore comments and blank lines.
load_env_file() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%$'\r'}"
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^[[:space:]]*(export[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      local key="${BASH_REMATCH[2]}"
      local val="${BASH_REMATCH[3]}"
      # Trim trailing inline comment (unquoted values only).
      if [[ ! "$val" =~ ^\" && ! "$val" =~ ^\' ]]; then
        val="${val%%[[:space:]]#*}"
      fi
      val="${val#"${val%%[![:space:]]*}"}"
      val="${val%"${val##*[![:space:]]}"}"
      if [[ "$val" =~ ^\"(.*)\"$ ]]; then
        val="${BASH_REMATCH[1]}"
      elif [[ "$val" =~ ^\'(.*)\'$ ]]; then
        val="${BASH_REMATCH[1]}"
      fi
      export "${key}=${val}"
    fi
  done < "$file"
}

load_env_file "${REPO_ROOT}/.env"
load_env_file "${REPO_ROOT}/.env.local"

export ERD_API_URL="${ERD_API_URL:-https://api.erdonline.com}"

if [[ "${1:-}" == "--check-env" ]]; then
  if [[ -n "${ERD_PAT:-}" ]]; then
    echo "ERD_PAT_nonempty: true"
  else
    echo "ERD_PAT_nonempty: false"
  fi
  echo "ERD_API_URL: ${ERD_API_URL}"
  exit 0
fi

NODE_BIN="$(resolve_node)"
NODE_VER="$("$NODE_BIN" -v 2>/dev/null || true)"
if [[ ! "$NODE_VER" =~ ^v(1[89]|[2-9][0-9]|20\.|21\.|22\.) ]]; then
  echo "erdonline-mcp needs Node >= 18 (got ${NODE_VER:-none})." >&2
  exit 1
fi

MCP_ENTRY="${REPO_ROOT}/mcp/dist/index.js"
if [[ ! -f "$MCP_ENTRY" ]]; then
  echo "Building local mcp package (missing ${MCP_ENTRY})…" >&2
  (cd "${REPO_ROOT}/mcp" && yarn install --silent && yarn build)
fi

exec "$NODE_BIN" "$MCP_ENTRY" "$@"
