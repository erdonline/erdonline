#!/usr/bin/env bash
# Start Chrome with remote debugging enabled so chrome-devtools-mcp can connect.
# This reuses your existing user profile (cookies, logins) on a fresh Chrome instance.

set -euo pipefail

DEBUG_PORT="${CHROME_DEBUG_PORT:-9222}"
USER_DATA_DIR="${CHROME_USER_DATA_DIR:-$HOME/Library/Application Support/Google/Chrome}"

if [[ "$OSTYPE" == "darwin"* ]]; then
  CHROME_BIN="${CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
else
  CHROME_BIN="${CHROME_BIN:-$(command -v google-chrome || command -v chromium-browser || command -v chromium)}"
fi

if [[ ! -x "$CHROME_BIN" ]]; then
  echo "Chrome not found at $CHROME_BIN. Set CHROME_BIN to the correct path." >&2
  exit 1
fi

echo "Starting Chrome with remote debugging on port $DEBUG_PORT..."
echo "Connect chrome-devtools-mcp with: --browser-url=http://127.0.0.1:$DEBUG_PORT"

# Important: close any running Chrome instances first, or this will fail to bind 9222.
exec "$CHROME_BIN" \
  --remote-debugging-port="$DEBUG_PORT" \
  --user-data-dir="$USER_DATA_DIR" \
  --no-first-run \
  --no-default-browser-check \
  "about:blank"
