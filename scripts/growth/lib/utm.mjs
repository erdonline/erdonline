/**
 * 增长链路 UTM 与链接常量（单一事实源）。
 * 纪律：文章 CTA 永远只有一个主链接 = demo；star/repo 只放文末次要位置（见 docs/growth.md）。
 */
export const DEMO_BASE_URL = 'https://www.erdonline.com';
export const DEMO_URL = `${DEMO_BASE_URL}/demo`;
export const REPO_URL = 'https://github.com/erdonline/erdonline';
export const DOCS_URL = 'https://erdonline.github.io/erdonline/';
export const COMPARE_URL = `${DEMO_BASE_URL}/compare`;
export const DEPLOY_DOC_URL = `${DOCS_URL}docs/deployment`;

/** CTA 落点 → 目标 URL（frontmatter `cta:` 的合法取值） */
export const CTA_TARGETS = {
  demo: DEMO_URL,
  compare: COMPARE_URL,
  docs: DOCS_URL,
  deploy: DEPLOY_DOC_URL,
  repo: REPO_URL,
};

/**
 * 给 URL 追加 UTM。缺省 medium=article；campaign 默认 launch。
 * @param {string} url
 * @param {{source: string, medium?: string, campaign?: string, content?: string}} opts
 */
export function withUtm(url, { source, medium = 'article', campaign = 'launch', content } = {}) {
  if (!source) throw new Error('withUtm: source is required');
  const u = new URL(url);
  u.searchParams.set('utm_source', source);
  u.searchParams.set('utm_medium', medium);
  u.searchParams.set('utm_campaign', campaign);
  if (content) u.searchParams.set('utm_content', content);
  return u.toString();
}

/**
 * 文章 CTA 链接：按 cta 落点 + 平台 source + 文章 slug 生成。
 * @param {string} cta CTA_TARGETS 的键
 * @param {string} platform 平台名（juejin/zhihu/v2ex/wechat/...）
 * @param {string} slug 文章 slug（进 utm_content，区分单篇带量）
 * @param {string} [campaign]
 */
export function ctaUrl(cta, platform, slug, campaign = 'launch') {
  const target = CTA_TARGETS[cta];
  if (!target) {
    throw new Error(`unknown cta "${cta}"; valid: ${Object.keys(CTA_TARGETS).join(', ')}`);
  }
  return withUtm(target, { source: platform, campaign, content: slug });
}
