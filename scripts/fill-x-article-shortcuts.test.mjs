/**
 * CLI smoke tests for fill-x-article-shortcuts — no Chrome success path.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const CLI = path.join(process.cwd(), 'scripts/fill-x-article-shortcuts.mjs');
const NODE = process.execPath;

function runCli(args, { timeoutMs = 15_000 } = {}) {
  return spawnSync(NODE, [CLI, ...args], {
    encoding: 'utf8',
    timeout: timeoutMs,
    env: { ...process.env },
  });
}

test('--submit exits 1 with HARD STOP before Chrome', () => {
  const result = runCli(['--submit']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /HARD STOP/);
  assert.doesNotMatch(
    `${result.stdout}${result.stderr}`,
    /chrome-devtools|npx.*chrome/i,
    'must not spawn chrome-devtools on --submit',
  );
});

test('unknown flag exits 1', () => {
  const result = runCli(['--not-a-real-flag']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown flag/);
});

test('--compile-only --dump-payload writes JSON with insertPlan length 4, no Chrome', () => {
  const tmp = path.join(os.tmpdir(), `x-article-payload-${process.pid}.json`);
  try {
    const result = runCli([
      '--slug=dont-give-agent-prod-db',
      '--compile-only',
      `--dump-payload=${tmp}`,
    ]);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /compile-only: skipping Chrome playback/);
    assert.doesNotMatch(
      `${result.stdout}${result.stderr}`,
      /chrome-devtools|npx.*chrome/i,
      'compile-only must not mention chrome-devtools spawn',
    );
    assert.ok(fs.existsSync(tmp), 'dump-payload file written');
    const payload = JSON.parse(fs.readFileSync(tmp, 'utf8'));
    assert.equal(payload.insertPlan.length, 4);
    const kinds = payload.insertPlan.map((e) => e.kind);
    assert.deepEqual(kinds, ['code', 'code', 'table', 'code']);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
});
