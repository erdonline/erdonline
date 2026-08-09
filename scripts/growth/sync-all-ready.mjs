#!/usr/bin/env node
/**
 * 把全部 ready 文章同步到 Wechatsync 草稿箱（默认同步平台，跳过 v2ex）。
 *
 *   node scripts/growth/sync-all-ready.mjs
 *   node scripts/growth/sync-all-ready.mjs --platforms juejin,csdn,oschina,xiaohongshu
 *   node scripts/growth/sync-all-ready.mjs --dry-run
 */
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parseFrontmatter } from './lib/frontmatter.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const ARTICLES = path.join(ROOT, 'content/articles');
const DEFAULT_PLATFORMS = 'juejin,csdn,oschina,xiaohongshu';

function parseArgs(argv) {
  const args = { platforms: DEFAULT_PLATFORMS, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--dry-run') args.dryRun = true;
    else if (argv[i] === '--platforms') args.platforms = argv[++i] || DEFAULT_PLATFORMS;
  }
  return args;
}

const args = parseArgs(process.argv);
const files = readdirSync(ARTICLES).filter(
  (f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md',
);
const slugs = [];
for (const f of files) {
  const { data } = parseFrontmatter(readFileSync(path.join(ARTICLES, f), 'utf8'));
  if (data.status === 'ready' || data.status === 'published') slugs.push(data.slug || f.replace(/\.md$/, ''));
}
slugs.sort();
console.log(`将同步 ${slugs.length} 篇 → platforms=${args.platforms}${args.dryRun ? ' (dry-run)' : ''}`);

let failed = 0;
for (const slug of slugs) {
  const cli = [
    path.join(__dirname, 'sync-wechatsync.mjs'),
    slug,
    '--platforms',
    args.platforms,
  ];
  if (args.dryRun) cli.push('--dry-run');
  console.log(`\n======== ${slug} ========`);
  const r = spawnSync(process.execPath, cli, { stdio: 'inherit', cwd: ROOT, env: process.env });
  if (r.status !== 0) failed += 1;
}
console.log(failed ? `\n完成，失败 ${failed}/${slugs.length} 篇` : `\n全部成功 ${slugs.length} 篇`);
process.exit(failed ? 1 : 0);
