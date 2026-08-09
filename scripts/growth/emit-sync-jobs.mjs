#!/usr/bin/env node
/**
 * Emit JSONL jobs for MCP sync: one line per {slug, platform, title, markdown}
 * Usage: node scripts/growth/emit-sync-jobs.mjs [platforms csv]
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from './lib/frontmatter.mjs';
import { PLATFORM_ARTIFACT } from './lib/wechatsync.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ARTICLES = path.join(ROOT, 'content/articles');
const DIST = path.join(ROOT, 'content/dist');
const filter = (process.argv[2] || 'juejin,csdn,oschina,xiaohongshu,weixin,zhihu,segmentfault')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

for (const f of readdirSync(ARTICLES).filter((x) => x.endsWith('.md') && x !== 'README.md')) {
  const { data } = parseFrontmatter(readFileSync(path.join(ARTICLES, f), 'utf8'));
  if (!['ready', 'published'].includes(data.status)) continue;
  const slug = data.slug;
  for (const platform of filter) {
    if (platform === 'v2ex') continue;
    const artifact = PLATFORM_ARTIFACT[platform];
    if (!artifact) continue;
    const file = path.join(DIST, slug, artifact);
    if (!existsSync(file)) {
      console.error(JSON.stringify({ error: 'missing', slug, platform, file }));
      continue;
    }
    const raw = readFileSync(file, 'utf8');
    const lines = raw.split(/\r?\n/);
    let title = data.title;
    let body = raw;
    if (lines[0]?.startsWith('# ')) {
      title = lines[0].replace(/^#\s+/, '').trim();
      body = lines.slice(1).join('\n').replace(/^\n+/, '');
    }
    console.log(JSON.stringify({ slug, platform, title, markdown: body }));
  }
}
