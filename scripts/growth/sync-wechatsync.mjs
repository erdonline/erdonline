#!/usr/bin/env node
/**
 * 把 build-package 产物经 Wechatsync（文章同步助手）同步到各平台草稿箱。
 *
 * 前置（一次性）：
 *   1. Chrome 安装「文章同步助手」扩展，浏览器登录目标平台
 *   2. 扩展设置 → 开启 MCP 连接 → 复制 Token → 写入 .env 的 WECHATSYNC_TOKEN
 *   3. cd scripts/growth && npm install
 *
 * 用法：
 *   node scripts/growth/sync-wechatsync.mjs <slug>              # 同步一篇（status=ready）
 *   node scripts/growth/sync-wechatsync.mjs <slug> --dry-run    # 预览，不连扩展
 *   node scripts/growth/sync-wechatsync.mjs <slug> --rebuild     # 先 build-package 再同步
 *   node scripts/growth/sync-wechatsync.mjs --check-auth          # 看扩展已登录的平台
 *
 * 说明：每平台单独 sync（UTM source=平台 已在各 *.md 里注入）；V2EX 仍人工。
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parseFrontmatter } from './lib/frontmatter.mjs';
import {
  PLATFORM_ARTIFACT,
  WECHATSYNC_PLATFORM_MAP,
  resolveWechatsyncPlatforms,
  ensureWechatsyncCli,
  validateWechatsyncEnv,
  GROWTH_DIR,
} from './lib/wechatsync.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const ARTICLES_DIR = path.join(ROOT, 'content/articles');
const DIST_DIR = path.join(ROOT, 'content/dist');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check-auth') args.checkAuth = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--rebuild') args.rebuild = true;
    else if (a.startsWith('--')) {
      const key = a.slice(2);
      args[key] = argv[++i];
    } else args._.push(a);
  }
  return args;
}

function rebuildPackage(slug) {
  const r = spawnSync(process.execPath, [path.join(__dirname, 'build-package.mjs'), slug], {
    stdio: 'inherit',
    cwd: ROOT,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function loadArticle(slug) {
  const file = slug.endsWith('.md') ? slug : `${slug}.md`;
  const articlePath = path.join(ARTICLES_DIR, file);
  if (!existsSync(articlePath)) {
    console.error(`找不到文章: content/articles/${file}`);
    process.exit(1);
  }
  const raw = readFileSync(articlePath, 'utf8');
  const { data: fm } = parseFrontmatter(raw);
  if (!fm.slug) fm.slug = slug.replace(/\.md$/, '');
  return fm;
}

const args = parseArgs(process.argv);

if (args.checkAuth) {
  validateWechatsyncEnv({ dryRun: false, requireToken: true });
  ensureWechatsyncCli();
  console.log('检查 Wechatsync 平台登录态（需 Chrome 扩展已连接）…');
  const bin = path.join(GROWTH_DIR, 'node_modules', '.bin', 'wechatsync');
  const r = spawnSync(bin, ['platforms', '--auth'], { stdio: 'inherit', env: process.env });
  process.exit(r.status ?? 0);
}

const slug = args._[0];
if (!slug) {
  console.error(
    '用法: node scripts/growth/sync-wechatsync.mjs <slug> [--dry-run] [--rebuild]\n' +
      '      node scripts/growth/sync-wechatsync.mjs --check-auth',
  );
  process.exit(1);
}

validateWechatsyncEnv({ dryRun: !!args.dryRun, requireToken: !args.dryRun });
ensureWechatsyncCli();

const fm = loadArticle(slug);
if (fm.status !== 'ready' && fm.status !== 'published' && !args.dryRun) {
  console.error(`文章 status=${fm.status}，请改为 ready 后再同步（或加 --dry-run 预览）`);
  process.exit(1);
}

if (args.rebuild) rebuildPackage(fm.slug);

const distDir = path.join(DIST_DIR, fm.slug);
if (!existsSync(distDir)) {
  console.error(`缺少发布包 ${path.relative(ROOT, distDir)}/ ，请先运行：`);
  console.error(`  node scripts/growth/build-package.mjs ${fm.slug}`);
  process.exit(1);
}

const { sync, skipped } = resolveWechatsyncPlatforms(fm.platforms || []);
if (skipped.length) {
  for (const s of skipped) console.log(`⊘ 跳过 ${s.platform}：${s.reason}`);
}
if (sync.length === 0) {
  console.error('没有可经 Wechatsync 同步的平台（frontmatter platforms 仅含 v2ex 等）');
  process.exit(1);
}

console.log(`\nWechatsync 同步：${fm.title}`);
console.log(`  slug: ${fm.slug}`);
console.log(`  平台: ${sync.join(', ')}`);
if (!args.dryRun) {
  console.log('  模式: 草稿（各平台草稿箱确认后再点发布）');
  console.log('  请确保 Chrome 扩展已打开且 MCP 连接成功\n');
}

let failed = false;
for (const platform of sync) {
  const artifact = PLATFORM_ARTIFACT[platform];
  const file = path.join(distDir, artifact);
  if (!existsSync(file)) {
    console.error(`✗ 缺少 ${path.relative(ROOT, file)}，请 rebuild-package`);
    failed = true;
    continue;
  }
  const wsPlatform = WECHATSYNC_PLATFORM_MAP[platform] || platform;
  const cliArgs = ['sync', file, '-p', wsPlatform, '-t', fm.title];
  if (args.dryRun) cliArgs.push('--dry-run');
  console.log(`→ ${platform}: ${path.relative(ROOT, file)}`);
  const r = spawnSync(
    path.join(GROWTH_DIR, 'node_modules', '.bin', 'wechatsync'),
    cliArgs,
    {
      stdio: 'inherit',
      env: process.env,
    },
  );
  if (r.status !== 0) {
    failed = true;
    if (!args.dryRun) {
      console.error(`✗ ${platform} 同步失败（扩展未连接 / 未登录 / Token 不一致？）`);
    }
  } else {
    console.log(`✓ ${platform} ${args.dryRun ? 'dry-run 通过' : '已提交草稿同步请求'}`);
  }
}

if (failed) process.exit(1);
console.log(
  args.dryRun
    ? '\n完成 dry-run。实同步：配置 WECHATSYNC_TOKEN + 扩展连接后去掉 --dry-run'
    : '\n完成。请到各平台草稿箱核对排版与 UTM 链接后再发布。',
);
