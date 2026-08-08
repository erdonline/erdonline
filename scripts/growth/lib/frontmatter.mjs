/**
 * 极简 YAML frontmatter 读写（仅支持本流水线用到的子集：标量、行内数组）。
 * 不引第三方依赖，保持 `node scripts/growth/*.mjs` 零安装可跑。
 */

/**
 * @param {string} raw 文章 markdown 全文
 * @returns {{ data: Record<string, any>, body: string }}
 */
export function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let [, key, value] = kv;
    value = value.trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    } else {
      data[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }
  return { data, body: m[2] };
}

/**
 * @param {Record<string, any>} data
 * @param {string} body
 * @returns {string} 拼装后的 markdown
 */
export function stringifyFrontmatter(data, body) {
  const lines = Object.entries(data).map(([k, v]) =>
    Array.isArray(v) ? `${k}: [${v.join(', ')}]` : `${k}: ${v}`,
  );
  return `---\n${lines.join('\n')}\n---\n${body.replace(/^\n+/, '\n')}`;
}

export const ARTICLE_STATUSES = ['draft', 'ready', 'published'];
export const PLATFORMS = [
  'juejin',
  'zhihu',
  'v2ex',
  'wechat',
  'weixin',
  'csdn',
  'segmentfault',
  'oschina',
  'xiaohongshu',
];
