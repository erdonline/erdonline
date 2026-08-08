#!/usr/bin/env node
/**
 * 从模板脚手架一篇增长文章。
 *
 * 用法：
 *   node scripts/growth/new-article.mjs --slug git-style-version-diff \
 *     --title "数据库表结构改崩了谁背锅？" --platforms juejin,zhihu --cta demo
 *
 * 产物：content/articles/<slug>.md（status=draft，含 {{CTA}} 占位符）
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CTA_TARGETS } from './lib/utm.mjs';
import { PLATFORMS } from './lib/frontmatter.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const TEMPLATE = path.join(__dirname, 'article-template.md');
const OUT_DIR = path.join(ROOT, 'content/articles');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    args[key] = argv[i + 1];
  }
  return args;
}

const args = parseArgs(process.argv);
const { slug, title } = args;
if (!slug || !title) {
  console.error(
    '用法: node scripts/growth/new-article.mjs --slug <slug> --title "<标题>" [--platforms juejin,zhihu] [--cta demo]',
  );
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  console.error(`slug "${slug}" 非法：小写字母/数字/连字符，字母开头`);
  process.exit(1);
}

const platforms = (args.platforms || 'juejin').split(',').map((s) => s.trim());
for (const p of platforms) {
  if (!PLATFORMS.includes(p)) {
    console.error(`platform "${p}" 未知；合法值: ${PLATFORMS.join(', ')}`);
    process.exit(1);
  }
}
const cta = args.cta || 'demo';
if (!CTA_TARGETS[cta]) {
  console.error(`cta "${cta}" 未知；合法值: ${Object.keys(CTA_TARGETS).join(', ')}`);
  process.exit(1);
}

const outFile = path.join(OUT_DIR, `${slug}.md`);
if (existsSync(outFile)) {
  console.error(`已存在: ${path.relative(ROOT, outFile)}（不会覆盖）`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const content = readFileSync(TEMPLATE, 'utf8')
  .replaceAll('{{title}}', title)
  .replaceAll('{{slug}}', slug)
  .replaceAll('{{date}}', today)
  .replace('platforms: [juejin]', `platforms: [${platforms.join(', ')}]`)
  .replace('cta: demo', `cta: ${cta}`);

writeFileSync(outFile, content, 'utf8');
console.log(`已创建 ${path.relative(ROOT, outFile)}`);
console.log(`下一步：写正文 → status 改 ready → node scripts/growth/build-package.mjs ${slug}`);
