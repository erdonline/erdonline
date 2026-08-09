#!/usr/bin/env node
/**
 * CSDN 补发：篇间间隔；遇「频繁发布」自动加长等待并重试同篇。
 *
 *   node scripts/growth/retry-csdn.mjs [--interval 180] [--rate-wait 300] [slug...]
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const STATUS = path.join(ROOT, 'content/articles/publish-status-2026-08-09.json');

function sleep(sec) {
  console.log(`…等待 ${sec}s`);
  spawnSync('sleep', [String(sec)], { stdio: 'inherit' });
}

function parseArgs(argv) {
  let interval = 180;
  let rateWait = 300;
  let maxAttempts = 4;
  const slugs = [];
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--interval') interval = Number(argv[++i]) || 180;
    else if (argv[i] === '--rate-wait') rateWait = Number(argv[++i]) || 300;
    else if (argv[i] === '--max-attempts') maxAttempts = Number(argv[++i]) || 4;
    else slugs.push(argv[i]);
  }
  return { interval, rateWait, maxAttempts, slugs };
}

function syncOne(slug) {
  const r = spawnSync(
    process.execPath,
    [path.join(__dirname, 'sync-wechatsync.mjs'), slug, '--platforms', 'csdn'],
    { stdio: 'pipe', encoding: 'utf8', env: process.env, cwd: ROOT },
  );
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  process.stdout.write(out);
  const rateLimited = /频繁发布/.test(out);
  const ok = /同步完成: 1 成功, 0 失败/.test(out) && !/同步完成: 0 成功/.test(out) && !rateLimited;
  const urlM = out.match(/https:\/\/editor\.csdn\.net\/md\?articleId=\d+/);
  const errM = out.match(/✗ csdn\s*\n\s*([^\n]+)/);
  return {
    ok,
    rateLimited,
    url: urlM?.[0] || null,
    error: ok ? null : (errM?.[1]?.trim() || (rateLimited ? '文章频繁发布，请稍后再试' : `exit ${r.status}`)),
  };
}

function updateStatus(slug, entry) {
  const status = JSON.parse(readFileSync(STATUS, 'utf8'));
  if (!status[slug]?.platforms?.csdn) return;
  if (entry.ok) {
    status[slug].platforms.csdn = {
      status: 'ok',
      url: entry.url,
      error: null,
      note: null,
      retried_at: new Date().toISOString(),
    };
  } else {
    status[slug].platforms.csdn.error = entry.error;
    status[slug].platforms.csdn.retried_at = new Date().toISOString();
  }
  writeFileSync(STATUS, JSON.stringify(status, null, 2) + '\n', 'utf8');
}

const { interval, rateWait, maxAttempts, slugs: argSlugs } = parseArgs(process.argv);
const status = JSON.parse(readFileSync(STATUS, 'utf8'));
let targets = argSlugs.length
  ? argSlugs
  : Object.keys(status).filter((s) => status[s].platforms?.csdn?.status === 'fail');

if (!targets.length) {
  console.log('没有待补发的 CSDN 失败项');
  process.exit(0);
}

console.log(`CSDN 补发 ${targets.length} 篇；正常间隔 ${interval}s；频控等待 ${rateWait}s；单篇最多 ${maxAttempts} 次\n`);
const results = [];

for (let i = 0; i < targets.length; i++) {
  const slug = targets[i];
  console.log(`\n======== [${i + 1}/${targets.length}] ${slug} ========`);
  let entry = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) console.log(`重试 ${attempt}/${maxAttempts}`);
    entry = syncOne(slug);
    if (entry.ok) {
      updateStatus(slug, entry);
      console.log(`✓ 台账已更新: ${entry.url}`);
      break;
    }
    if (entry.rateLimited && attempt < maxAttempts) {
      console.log(`✗ 频控：${entry.error}`);
      sleep(rateWait);
      continue;
    }
    updateStatus(slug, entry);
    console.log(`✗ 仍失败: ${entry.error}`);
    break;
  }
  results.push({ slug, ...entry });
  if (i < targets.length - 1) sleep(interval);
}

const okN = results.filter((x) => x.ok).length;
console.log(`\n完成：成功 ${okN}/${results.length}`);
for (const r of results) {
  console.log(`  ${r.ok ? '✓' : '✗'} ${r.slug} ${r.url || r.error || ''}`);
}
process.exit(okN === results.length ? 0 : 1);
