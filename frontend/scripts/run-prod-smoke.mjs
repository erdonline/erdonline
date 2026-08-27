#!/usr/bin/env node
/**
 * Build (optional) + serve dist + Playwright prod boot smoke.
 *
 * Env:
 *   PROD_SMOKE_SKIP_BUILD=1  — use existing dist/ (CI after yarn build)
 *   PROD_SMOKE_REBUILD=1     — force yarn build even if dist exists
 *   PROD_SMOKE_BASE_URL      — skip local serve (external URL)
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.resolve(__dirname, '..');
const DIST_INDEX = path.join(FRONTEND, 'dist', 'index.html');

function run(cmd, args, opts = {}) {
  execFileSync(cmd, args, {
    cwd: FRONTEND,
    stdio: 'inherit',
    ...opts,
  });
}

function main() {
  const skipBuild = process.env.PROD_SMOKE_SKIP_BUILD === '1';
  const forceRebuild = process.env.PROD_SMOKE_REBUILD === '1';

  if (!skipBuild && (forceRebuild || !existsSync(DIST_INDEX))) {
    console.log('[prod-smoke] building dist (yarn build)…');
    run('yarn', ['build']);
  } else if (!existsSync(DIST_INDEX) && process.env.PROD_SMOKE_BASE_URL) {
    console.log('[prod-smoke] no local dist; using PROD_SMOKE_BASE_URL');
  } else if (!existsSync(DIST_INDEX)) {
    console.error('[prod-smoke] dist/index.html missing — run yarn build or unset PROD_SMOKE_SKIP_BUILD');
    process.exit(1);
  } else {
    console.log('[prod-smoke] using existing dist/');
  }

  console.log('[prod-smoke] directory shells resolve before SPA fallback…');
  run('node', ['./scripts/serve-dist-pages.mjs', '--check']);

  console.log('[prod-smoke] Playwright boot smoke on public URLs…');
  run('npx', [
    'playwright',
    'test',
    '--config=playwright.prod-smoke.config.ts',
    '--project=prod-smoke',
  ]);

  console.log('[prod-smoke] PASS');
}

main();
