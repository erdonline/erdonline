#!/usr/bin/env sh
# Symlink repo git hooks from scripts/git-hooks/ (idempotent).
set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
HOOKS_SRC="$ROOT/scripts/git-hooks"
GIT_HOOKS="$ROOT/.git/hooks"

if [ ! -d "$GIT_HOOKS" ]; then
  echo "install-git-hooks: not a git repo (.git/hooks missing)" >&2
  exit 1
fi

for hook in pre-push; do
  src="$HOOKS_SRC/$hook"
  dest="$GIT_HOOKS/$hook"
  if [ ! -f "$src" ]; then
    echo "install-git-hooks: missing $src" >&2
    exit 1
  fi
  ln -sf "../../scripts/git-hooks/$hook" "$dest"
  chmod +x "$src"
  echo "installed $dest -> scripts/git-hooks/$hook"
done

echo "Done. Pre-push: check:routes + check:i18n; frontend changes → check:prod-smoke (~3–5 min)"
