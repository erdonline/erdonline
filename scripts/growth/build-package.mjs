#!/usr/bin/env node
/**
 * 把一篇 ready 文章构建成各平台可直接粘贴的发布包。
 *
 * 用法：
 *   node scripts/growth/build-package.mjs <slug>            # 单篇
 *   node scripts/growth/build-package.mjs --all             # 全部 ready
 *   node scripts/growth/build-package.mjs --all --status draft   # 预览草稿也行
 *
 * 产物：content/dist/<slug>/
 *   - <platform>.md（juejin/zhihu/wechat/segmentfault/oschina：完整正文，UTM 已注入）
 *   - v2ex.txt（精简版：标题 + 导语 + 链接，V2EX 不支持 Markdown 图文排版）
 *   - publish-checklist.md（人工发布核对单——发布动作本身必须人做，见 docs/growth.md）
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ctaUrl, withUtm, docsPageUrl, githubPublicUrl, REPO_URL, DOCS_URL } from './lib/utm.mjs';
import { parseFrontmatter, ARTICLE_STATUSES, PLATFORMS } from './lib/frontmatter.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const ARTICLES_DIR = path.join(ROOT, 'content/articles');
const DIST_DIR = path.join(ROOT, 'content/dist');

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      if (key === 'all') args.all = true;
      else {
        args[key] = argv[i + 1];
        i++;
      }
    } else {
      args._.push(argv[i]);
    }
  }
  return args;
}

/** 主 CTA 文案（按 cta 落点，避免 docs/deploy/repo 仍写「免注册 demo」） */
const CTA_LABEL = {
  demo: '30 秒免注册亲手验证',
  compare: '打开竞品对照页 /compare',
  docs: '阅读文档与 API / MCP 说明',
  mcp: '30 秒复制 Cursor MCP 配置',
  deploy: '打开自托管部署指南',
  repo: '打开 GitHub 仓库（Issue / PR）',
};

/** 主 CTA 区块（每平台一份，链接带该平台 source 的 UTM） */
function ctaBlock(fm, platform) {
  const url = ctaUrl(fm.cta, platform, fm.slug, fm.utm_campaign || 'launch');
  const repo = withUtm(REPO_URL, {
    source: platform,
    campaign: fm.utm_campaign || 'launch',
    content: fm.slug,
  });
  const label = CTA_LABEL[fm.cta] || CTA_LABEL.demo;
  const lines = [`> 👉 **${label}**：${url}`];
  if (fm.cta !== 'repo') {
    lines.push('', `开源地址（MIT，欢迎 star / issue / PR）：${repo}`);
  }
  return lines.join('\n');
}

/** 替换正文占位符；未写 {{CTA}} 则在文末自动补主 CTA 区块 */
function renderBody(fm, body, platform) {
  const utm = {
    source: platform,
    campaign: fm.utm_campaign || 'launch',
    content: fm.slug,
  };
  let out = body
    .replaceAll('{{CTA}}', ctaBlock(fm, platform))
    .replaceAll('{{REPO}}', withUtm(REPO_URL, utm))
    .replaceAll('{{DOCS}}', withUtm(DOCS_URL, utm))
    // {{DOC:data-format}} → 文档站子页（公开可读）
    .replace(/\{\{DOC:([a-zA-Z0-9_./-]+)\}\}/g, (_, page) => docsPageUrl(page, utm))
    // {{GH:CONTRIBUTING.md}} / {{GH_TREE:mcp}} → GitHub 公开路径
    .replace(/\{\{GH:([a-zA-Z0-9_./-]+)\}\}/g, (_, p) => githubPublicUrl(p, utm))
    .replace(/\{\{GH_TREE:([a-zA-Z0-9_./-]+)\}\}/g, (_, p) =>
      githubPublicUrl(p, { ...utm, tree: true }),
    );
  if (!body.includes('{{CTA}}')) {
    out = `${out.trimEnd()}\n\n---\n\n${ctaBlock(fm, platform)}\n`;
  }
  return out.replace(/^<!--[\s\S]*?-->\n*/, (m) => (m.includes('写作纪律') ? '' : m));
}

/** 去掉 Markdown 装饰，留给小红书短图文 */
function plainText(md) {
  return md
    .replace(/^#+\s*/gm, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~>|-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 小红书精简版：从正文抽导语 + 要点 + demo CTA（按篇生成，禁止写死某篇文案） */
function renderXiaohongshu(fm, body) {
  const repo = withUtm(REPO_URL, {
    source: 'xiaohongshu',
    medium: 'post',
    campaign: fm.utm_campaign || 'launch',
    content: fm.slug,
  });
  const title =
    typeof fm.xhs_title === 'string' && fm.xhs_title.trim()
      ? fm.xhs_title.trim()
      : fm.title.length > 22
        ? `${fm.title.slice(0, 20)}…`
        : fm.title;

  const clean = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\{\{(CTA|REPO|DOCS)\}\}/g, '')
    .trim();
  const blocks = clean
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b && !b.startsWith('|') && !b.startsWith('>'));

  let hook = '';
  for (const b of blocks) {
    if (/^#+\s/.test(b) || /^- /.test(b)) continue;
    const t = plainText(b);
    if (t.length > 40) {
      hook = t.slice(0, 180);
      break;
    }
  }
  if (!hook) hook = plainText(blocks[0] || fm.title).slice(0, 180);

  const bullets = [];
  for (const b of blocks) {
    for (const line of b.split('\n')) {
      const m = line.match(/^\s*[-*]\s+\**(.+?)\**\s*$/);
      if (!m) continue;
      const item = plainText(m[1]);
      if (item.length >= 8 && item.length <= 60) bullets.push(item);
      if (bullets.length >= 3) break;
    }
    if (bullets.length >= 3) break;
  }
  if (bullets.length === 0) {
    bullets.push('版本快照 + 字段级 diff', 'MIT 可自托管 docker compose up -d', '开放 projectJSON，可协作可逆向');
  }

  const ctaLabel = CTA_LABEL[fm.cta] || CTA_LABEL.demo;
  const primary = ctaUrl(fm.cta, 'xiaohongshu', fm.slug, fm.utm_campaign || 'launch');

  return `# ${title}

${hook}

${bullets.map((x) => `- ${x}`).join('\n')}

${ctaLabel} 👇

👉 ${primary}

开源地址：${repo}
`;
}

/** V2EX 精简版：标题 + 首段导语 + 链接 */
function renderV2ex(fm, body) {
  const paragraphs = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\{\{(CTA|REPO|DOCS)\}\}/g, '')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/^#+\s*/gm, '').replace(/[*>`]/g, '').trim())
    .filter((p) => p.length > 20);
  const intro = paragraphs.slice(0, 2).join('\n\n').slice(0, 600);
  const demo = ctaUrl(fm.cta, 'v2ex', fm.slug, fm.utm_campaign || 'launch');
  const repo = withUtm(REPO_URL, { source: 'v2ex', medium: 'post', campaign: fm.utm_campaign || 'launch', content: fm.slug });
  return `${fm.title}\n\n${intro}\n\n30 秒免注册 demo：${demo}\n开源（MIT）：${repo}\n\n（完整图文版见掘金同名文章；欢迎拍砖，作者在线答疑）\n`;
}

const PLATFORM_FILE = {
  juejin: 'juejin.md',
  zhihu: 'zhihu.md',
  wechat: 'wechat.md',
  weixin: 'weixin.md',
  csdn: 'csdn.md',
  segmentfault: 'segmentfault.md',
  oschina: 'oschina.md',
  xiaohongshu: 'xiaohongshu.md',
  v2ex: 'v2ex.txt',
};

const PLATFORM_NOTE = {
  juejin: '编辑器直接粘贴 Markdown；文末外链允许；标签建议：前端/数据库/开源',
  zhihu: '编辑器「导入 Markdown」；或作为回答投放到存量问题（ER 图工具哪个好）',
  wechat: '粘贴进公众号编辑器后重排版（标题层级会丢，需手调）；投稿大号时附本文件 + 截图包',
  weixin: '同 wechat；无 chrome-devtools 公网 permalink 路径卡，新稿勿列入 platforms',
  csdn: '编辑器粘贴 Markdown；标签建议：数据库/开源/架构',
  segmentfault: '无 chrome-devtools 公网 permalink 路径卡；勿写进 platforms YAML',
  oschina: '与掘金同稿，改头段一句即可；或 node scripts/post-seo-essay.mjs oschina --slug=…',
  xiaohongshu: '短图文稿；无 chrome-devtools 长文路径卡；勿写进 platforms YAML',
  v2ex: '纯文本帖；发「分享创造」节点；作者需在评论区蹲守答疑',
};

function checklist(fm) {
  const lines = fm.platforms.map(
    (p) => `- [ ] [${p}] 粘贴 ${PLATFORM_FILE[p]} → ${PLATFORM_NOTE[p] || ''}`,
  );
  return `# 发布核对单：${fm.title}

> 公开发布走 chrome-devtools MCP + 路径卡（见 publish-article skill）。本包已把「写什么」压到零决策。

## 发前

- [ ] 正文截图已上传到目标平台（相对路径图片需逐张替换为平台图床）
- [ ] 主 CTA 链接点击可达（带 \`utm_source=<平台>&utm_content=${fm.slug}\`）
- [ ] 掘金标签/知乎问题/公众号转载授权已就位

## 发布（按平台）

${lines.join('\n')}

## 公开发布（chrome-devtools MCP）

- [ ] 读 \`.cursor/skills/publish-article/SKILL.md\` + \`docs/growth-templates/platform-post-recipes.md\` 路径卡
- [ ] 各平台 \`.md\` 经 chrome-devtools MCP 填表发帖；验公网 permalink；记入 \`docs/growth-data/\`（V2EX 仍人工 \`v2ex.txt\`）

## 发后 24h

- [ ] 同步分发：思否/开源中国（若 platforms 未含，改头段后补发）
- [ ] 记录阅读/点赞/demo UV 到运营备忘；4 周评审用（见 docs/growth.md 度量表）
- [ ] 本文件 status 改为 published 并填写 published_at，commit
`;
}

function validate(fm, file) {
  const errors = [];
  if (!fm.title) errors.push('缺 title');
  if (!fm.slug) errors.push('缺 slug');
  if (!ARTICLE_STATUSES.includes(fm.status)) {
    errors.push(`status "${fm.status}" 非法（${ARTICLE_STATUSES.join('/')}）`);
  }
  if (!Array.isArray(fm.platforms) || fm.platforms.length === 0) {
    errors.push('platforms 必须是非空行内数组，如 [juejin, zhihu]');
  } else {
    for (const p of fm.platforms) if (!PLATFORMS.includes(p)) errors.push(`platform "${p}" 未知`);
  }
  if (errors.length) {
    console.error(`✗ ${file}:\n  ${errors.join('\n  ')}`);
    process.exitCode = 1;
    return false;
  }
  return true;
}

/** @returns {'built'|'skipped'|false} */
function buildOne(file, { allowDraft }) {
  const raw = readFileSync(path.join(ARTICLES_DIR, file), 'utf8');
  const { data: fm, body } = parseFrontmatter(raw);
  if (!validate(fm, file)) return false;
  if (fm.status !== 'ready' && !(allowDraft || fm.status === 'published')) {
    console.log(`- 跳过 ${file}（status=${fm.status}，--status draft 可预览）`);
    return 'skipped';
  }

  const outDir = path.join(DIST_DIR, fm.slug);
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  for (const p of fm.platforms) {
    const name = PLATFORM_FILE[p];
    const content =
      p === 'v2ex'
        ? renderV2ex(fm, body)
        : p === 'xiaohongshu'
          ? renderXiaohongshu(fm, body)
          : `# ${fm.title}\n\n${renderBody(fm, body, p).trim()}\n`;
    writeFileSync(path.join(outDir, name), content, 'utf8');
  }
  writeFileSync(path.join(outDir, 'publish-checklist.md'), checklist(fm), 'utf8');
  console.log(`✓ ${fm.slug} → ${path.relative(ROOT, outDir)}/（${fm.platforms.join(', ')} + checklist）`);
  return 'built';
}

const args = parseArgs(process.argv);
if (!existsSync(ARTICLES_DIR)) {
  console.error('content/articles/ 不存在');
  process.exit(1);
}

let targets = [];
if (args.all) {
  targets = readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md');
} else if (args._[0]) {
  const file = args._[0].endsWith('.md') ? args._[0] : `${args._[0]}.md`;
  if (!existsSync(path.join(ARTICLES_DIR, file))) {
    console.error(`找不到文章: content/articles/${file}`);
    process.exit(1);
  }
  targets = [file];
} else {
  console.error('用法: node scripts/growth/build-package.mjs <slug> | --all [--status draft]');
  process.exit(1);
}

const allowDraft = args.status === 'draft';
let built = 0;
let failed = false;
for (const f of targets) {
  const r = buildOne(f, { allowDraft });
  if (r === false) failed = true;
  else if (r === 'built') built++;
}
if (failed) process.exit(1);
console.log(`完成：${built}/${targets.length} 篇已打包到 content/dist/`);
