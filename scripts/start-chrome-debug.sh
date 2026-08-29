#!/usr/bin/env bash
# Prepare Chrome so chrome-devtools-mcp can attach with the existing login session.
#
# Preferred (Chrome 144+): enable remote debugging in the already-running Chrome.
#   1. Open chrome://inspect/#remote-debugging
#   2. Allow incoming debugging connections
#   3. Cursor MCP / this repo uses --autoConnect (see .cursor/mcp.json)
#
# Fallback: start a dedicated Chrome on port 9222 (must close other Chrome first).
#   CHROME_DEBUG_PORT=9222 ./scripts/start-chrome-debug.sh
#   CHROME_DEVTOOLS_BROWSER_URL=http://127.0.0.1:9222
set -euo pipefail

DEBUG_PORT="${CHROME_DEBUG_PORT:-9222}"
DEVTOOLS_PORT_FILE="${HOME}/Library/Application Support/Google/Chrome/DevToolsActivePort"

if [[ "${1:-}" != "--force-9222" ]] && [[ -f "$DEVTOOLS_PORT_FILE" ]]; then
  echo "Chrome remote debugging already active ($DEVTOOLS_PORT_FILE)."
  echo "chrome-devtools-mcp --autoConnect should attach. Reload Cursor MCP if list_pages fails."
  exit 0
fi

if [[ "${1:-}" != "--force-9222" ]]; then
  echo "Enable Chrome remote debugging (keeps your logged-in profile):"
  echo "  1. In Chrome, open chrome://inspect/#remote-debugging"
  echo "  2. Allow incoming debugging connections"
  echo "  3. Reload the chrome-devtools MCP server in Cursor"
  echo
  echo "Opening chrome://inspect/#remote-debugging ..."
  open -a "Google Chrome" "chrome://inspect/#remote-debugging" || true
  echo
  echo "If you instead need a dedicated debug Chrome on :${DEBUG_PORT}:"
  echo "  close all Chrome windows, then: $0 --force-9222"
  exit 0
fi

USER_DATA_DIR="${CHROME_USER_DATA_DIR:-$HOME/Library/Application Support/Google/Chrome}"
if [[ "$OSTYPE" == "darwin"* ]]; then
  CHROME_BIN="${CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
else
  CHROME_BIN="${CHROME_BIN:-$(command -v google-chrome || command -v chromium-browser || command -v chromium)}"
fi

if [[ ! -x "$CHROME_BIN" ]]; then
  echo "Chrome not found at $CHROME_BIN. Set CHROME_BIN." >&2
  exit 1
fi

echo "Starting Chrome with --remote-debugging-port=${DEBUG_PORT}"
echo "Then: CHROME_DEVTOOLS_BROWSER_URL=http://127.0.0.1:${DEBUG_PORT}"
exec "$CHROME_BIN" \
  --remote-debugging-port="$DEBUG_PORT" \
  --user-data-dir="$USER_DATA_DIR" \
  --no-first-run \
  --no-default-browser-check \
  "about:blank"
