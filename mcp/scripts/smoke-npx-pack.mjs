#!/usr/bin/env node
/**
 * yarn build → npm pack → npx --package <tarball> erd-mcp
 * Asserts stdio ready so the GitHub Release install path cannot rot silently.
 *
 *   cd mcp && yarn smoke:npx
 */
import {spawn, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const mcpRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tgz = path.join(mcpRoot, 'erdonline-mcp-0.1.0.tgz');
const READY = 'erd-mcp stdio ready';

function run(cmd, args) {
  const r = spawnSync(cmd, args, {cwd: mcpRoot, stdio: 'inherit'});
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

run('yarn', ['install', '--frozen-lockfile']);
run('yarn', ['build']);
run('npm', ['pack']);
if (!fs.existsSync(tgz)) {
  console.error(`missing ${tgz}`);
  process.exit(1);
}

const listing = spawnSync('tar', ['tzf', tgz], {encoding: 'utf8'});
if (listing.status !== 0) {
  console.error(listing.stderr || 'tar tzf failed');
  process.exit(listing.status ?? 1);
}
if (!listing.stdout.split('\n').some((l) => l === 'package/README.md')) {
  console.error(listing.stdout);
  console.error('FAIL: tarball missing package/README.md (npx users must see install copy)');
  process.exit(1);
}

const env = {
  ...process.env,
  ERD_PAT: 'erd_pat_ci_dead',
  ERD_API_URL: 'https://erdonline-production.up.railway.app',
};
const child = spawn('npx', ['-y', '--package', tgz, 'erd-mcp'], {
  cwd: mcpRoot,
  env,
  stdio: ['ignore', 'pipe', 'pipe'],
});

let buf = '';
let passed = false;
const timer = setTimeout(() => {
  child.kill('SIGKILL');
}, 60_000);

function onChunk(chunk) {
  buf += chunk.toString();
  if (!passed && buf.includes(READY)) {
    passed = true;
    clearTimeout(timer);
    child.kill('SIGTERM');
  }
}

child.stdout.on('data', onChunk);
child.stderr.on('data', onChunk);
child.on('error', (err) => {
  clearTimeout(timer);
  console.error(err);
  process.exit(1);
});
child.on('close', () => {
  clearTimeout(timer);
  if (passed) {
    console.log('SMOKE OK', READY);
    process.exit(0);
  }
  console.error(buf || '(no output)');
  console.error('FAIL: npx tarball did not print stdio ready');
  process.exit(1);
});
