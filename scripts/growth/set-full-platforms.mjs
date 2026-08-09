import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter, stringifyFrontmatter } from './lib/frontmatter.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dir = path.join(ROOT, 'content/articles');
const CORE = ['juejin', 'csdn', 'oschina', 'xiaohongshu', 'weixin', 'zhihu', 'segmentfault'];
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.md') || f.toLowerCase() === 'readme.md') continue;
  const raw = readFileSync(path.join(dir, f), 'utf8');
  const { data, body } = parseFrontmatter(raw);
  if (!['ready', 'published'].includes(data.status)) continue;
  const keepV2ex = (data.platforms || []).includes('v2ex');
  data.platforms = [...CORE, ...(keepV2ex ? ['v2ex'] : [])];
  writeFileSync(path.join(dir, f), stringifyFrontmatter(data, body));
  console.log(`${data.slug} => ${data.platforms.join(',')}`);
}
