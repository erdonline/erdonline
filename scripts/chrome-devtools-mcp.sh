#!/usr/bin/env bash
# Launch chrome-devtools-mcp with Node >= 20.19 (repo default nvm is 20.18.0).
# Primary: --autoConnect to the already-logged-in Chrome (144+).
# Enable remote debugging once: chrome://inspect/#remote-debugging
# Fallback: CHROME_DEVTOOLS_BROWSER_URL=http://127.0.0.1:9222 ./scripts/start-chrome-debug.sh
set -euo pipefail

if [[ -x "${HOME}/.nvm/versions/node/v22.22.0/bin/node" ]]; then
  export PATH="${HOME}/.nvm/versions/node/v22.22.0/bin:${PATH}"
elif [[ -x /opt/homebrew/opt/node@22/bin/node ]]; then
  export PATH="/opt/homebrew/opt/node@22/bin:${PATH}"
fi

NODE_VER="$(node -v 2>/dev/null || true)"
if [[ ! "$NODE_VER" =~ ^v(2[1-9]|[3-9][0-9]|20\.(1[9]|[2-9][0-9])) ]]; then
  echo "chrome-devtools-mcp needs Node >= 20.19 LTS (got ${NODE_VER:-none})." >&2
  echo "Install nvm Node 22 or Homebrew node@22." >&2
  exit 1
fi

EXTRA=()
if [[ -n "${CHROME_DEVTOOLS_BROWSER_URL:-}" ]]; then
  EXTRA+=(--browserUrl="${CHROME_DEVTOOLS_BROWSER_URL}")
else
  EXTRA+=(--autoConnect)
fi

exec npx -y chrome-devtools-mcp@latest \
  --no-usage-statistics \
  "${EXTRA[@]}" \
  "$@"
