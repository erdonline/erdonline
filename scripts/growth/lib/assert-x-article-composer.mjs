/** Runtime guards: X long-form → Article composer only, never compose/post. */

export const TWEET_MAX = 280;

const ARTICLE_PATH = 'fill-x-article-shortcuts.mjs';
const ARTICLE_URL = 'https://x.com/compose/articles';

export function isXEssayPlatform(platform) {
  const p = (platform || '').toLowerCase();
  return p === 'x' || p === 'twitter' || p === 'x-article';
}

export function isXPostPlatform(platform) {
  const p = (platform || '').toLowerCase();
  return p === 'x' || p === 'twitter';
}

export function xLongformBlockedMessage() {
  return [
    'HARD STOP: 长文 = Article only；Post composer 发长文 = 失败。',
    '',
    `X long-form must use X Articles (${ARTICLE_URL}), never compose/post.`,
    `Use scripts/${ARTICLE_PATH} + docs/growth-templates/x-article-playbook.md`,
    '',
    `  1. Open ${ARTICLE_URL}`,
    `  2. node scripts/${ARTICLE_PATH} [--slug=<slug>] [--pageId=N] [--compile-only] [--audit]`,
  ].join('\n');
}

/** post-seo-essay.mjs: block x / twitter / x-article essay path entirely. */
export function assertXPlatformBlockedForEssay(platform) {
  if (!isXEssayPlatform(platform)) return;
  throw new Error(xLongformBlockedMessage());
}

export function isEssayBodyFile(bodyFile) {
  const file = (bodyFile || '').replace(/\\/g, '/');
  if (!file) return false;
  return (
    /docs\/growth-content\/.*-x\.md$/i.test(file) ||
    /docs\/growth-content\/.*seo-essay.*\.md$/i.test(file) ||
    /content\/articles\//.test(file) ||
    /-x\.md$/i.test(file)
  );
}

export function looksLikeMarkdownEssay(text) {
  const headings = (text.match(/^#{1,3} .+$/gm) || []).length;
  return headings >= 2;
}

function postAllBrowserBlockedMessage(detail) {
  return [
    'HARD STOP: 长文 = Article only；Post composer 发长文 = 失败。',
    '',
    detail,
    `Use X Articles (${ARTICLE_URL}), never compose/post:`,
    '  docs/growth-templates/x-article-playbook.md',
    `  node scripts/${ARTICLE_PATH} [--slug=<slug>] [--pageId=N] [--compile-only] [--audit]`,
    '',
    'post-all-browser.mjs --platform x is for ≤280-char short posts only.',
  ].join('\n');
}

/** post-all-browser.mjs: refuse long / essay bodies on X Post composer. */
export function assertNotXPostEssay({ platform, body = '', bodyFile = '', slugArg = null }) {
  if (!isXPostPlatform(platform)) return;

  if (isEssayBodyFile(bodyFile) || slugArg) {
    throw new Error(
      postAllBrowserBlockedMessage(
        'This body-file or --slug= indicates growth essay / long-form content.',
      ),
    );
  }

  if (body.length > TWEET_MAX) {
    throw new Error(
      postAllBrowserBlockedMessage(
        `X Post composer body exceeds ${TWEET_MAX} chars (got ${body.length}).`,
      ),
    );
  }

  if (looksLikeMarkdownEssay(body)) {
    throw new Error(
      postAllBrowserBlockedMessage('Body looks like markdown essay (multiple headings).'),
    );
  }
}

/** fill-x-article-*.mjs: refuse typing unless Article composer is open. */

/** Post-create edit composer — typing allowed only here. Example: …/edit/2093728235884605440 */
export const X_ARTICLE_EDIT_URL_RE =
  /^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/compose\/articles\/edit\/\d+(?:\/|$|\?)/i;

/** Pre-create articles hub — Create click only; no typing. */
export const X_ARTICLE_HUB_URL_RE =
  /^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/compose\/articles\/?(?:\?.*)?$/i;

/** Public viewer — not the composer; never type here. */
export const X_ARTICLE_PUBLIC_VIEWER_RE =
  /^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/[^/]+\/article\/\d+/i;

function rejectComposePost(href, url) {
  if (href.includes('compose/post') || href.includes('/compose/post')) {
    throw new Error(
      [
        'HARD STOP: X Article fill requires compose/articles, not compose/post.',
        '',
        `Close Post composer and open ${ARTICLE_URL}`,
        `Then run node scripts/${ARTICLE_PATH}`,
        'Never navigate to compose/post for long-form content.',
      ].join('\n'),
    );
  }
}

function rejectPublicViewer(href, url, context) {
  if (X_ARTICLE_PUBLIC_VIEWER_RE.test(href) && !href.includes('compose/articles')) {
    throw new Error(
      [
        `HARD STOP: ${context} — public article viewer is not the composer.`,
        `Got: ${url}`,
        'Open compose/articles hub, click Create, wait for compose/articles/edit/<id>.',
      ].join('\n'),
    );
  }
}

export function isXArticleHubUrl(url) {
  const href = (url || '').toLowerCase();
  if (!href || href.includes('compose/post')) return false;
  if (href.includes('/compose/articles/edit/')) return false;
  return X_ARTICLE_HUB_URL_RE.test(href);
}

export function isXArticleEditUrl(url) {
  return X_ARTICLE_EDIT_URL_RE.test(url || '');
}

/** Pre-create: hub list at compose/articles (no /edit/). */
export function assertXArticleHubUrl(url) {
  const href = (url || '').toLowerCase();
  if (!href) {
    throw new Error(
      [
        'HARD STOP: cannot resolve page URL for X Article hub.',
        `Open ${ARTICLE_URL} before clicking Create.`,
      ].join('\n'),
    );
  }
  rejectComposePost(href, url);
  rejectPublicViewer(href, url, 'hub navigation');
  if (/x\.com\/home(\?|$|\/)/.test(href) || /twitter\.com\/home(\?|$|\/)/.test(href)) {
    throw new Error(
      [
        'HARD STOP: home timeline is not X Article hub.',
        '',
        `Open ${ARTICLE_URL} before clicking Create.`,
      ].join('\n'),
    );
  }
  if (!isXArticleHubUrl(url)) {
    throw new Error(
      [
        'HARD STOP: expected X Article hub (compose/articles, no /edit/).',
        `Got: ${url}`,
        `Open ${ARTICLE_URL} — not edit URL, not compose/post.`,
      ].join('\n'),
    );
  }
}

/** Post-create: edit composer — required before any type_text / press_key. */
export function assertXArticleEditUrl(url) {
  const href = (url || '').toLowerCase();
  if (!href) {
    throw new Error(
      [
        'HARD STOP: cannot resolve page URL for X Article editor.',
        'Click button[aria-label="create"] and wait for compose/articles/edit/<id>.',
      ].join('\n'),
    );
  }
  rejectComposePost(href, url);
  rejectPublicViewer(href, url, 'typing');
  if (isXArticleHubUrl(url)) {
    throw new Error(
      [
        'HARD STOP: still on compose/articles hub — Create did not land.',
        '',
        'Click button[aria-label="create"] and wait until URL is compose/articles/edit/<id>.',
        `Example: https://x.com/compose/articles/edit/2093728235884605440`,
        `Got: ${url}`,
      ].join('\n'),
    );
  }
  if (!isXArticleEditUrl(url)) {
    throw new Error(
      [
        'HARD STOP: typing requires compose/articles/edit/<numericId>.',
        `Got: ${url}`,
        `Expected match: ${X_ARTICLE_EDIT_URL_RE}`,
        'Public /article/<id> viewer URLs are not the composer.',
      ].join('\n'),
    );
  }
}

/** @deprecated Prefer assertXArticleHubUrl (pre-create) or assertXArticleEditUrl (typing). */
export function assertXArticleUrlOrThrow(url) {
  return assertXArticleUrl(url);
}

export function assertXArticleUrl(url) {
  const href = (url || '').toLowerCase();
  if (!href) {
    throw new Error(
      [
        'HARD STOP: cannot resolve page URL for X Article fill.',
        `Open ${ARTICLE_URL} before running scripts/${ARTICLE_PATH}.`,
      ].join('\n'),
    );
  }
  rejectComposePost(href, url);
  if (/x\.com\/home(\?|$|\/)/.test(href) || /twitter\.com\/home(\?|$|\/)/.test(href)) {
    throw new Error(
      [
        'HARD STOP: home timeline tweet box is not X Article composer.',
        '',
        `Open ${ARTICLE_URL} (or compose/articles/edit/<id>) before fill script types.`,
      ].join('\n'),
    );
  }
  if (isXArticleHubUrl(url) || isXArticleEditUrl(url)) return;
  if (X_ARTICLE_PUBLIC_VIEWER_RE.test(href)) {
    throw new Error(
      [
        'HARD STOP: public article viewer is not the composer.',
        `Got: ${url}`,
        'Use compose/articles/edit/<id> for fill.',
      ].join('\n'),
    );
  }
  throw new Error(
    [
      'HARD STOP: current page is not X Article composer.',
      `Got: ${url}`,
      `Expected compose/articles hub or compose/articles/edit/<id>.`,
    ].join('\n'),
  );
}

export function pageUrlFromList(pagesJson, pageId) {
  const list = pagesJson?.pages || pagesJson;
  if (!Array.isArray(list)) return null;
  const id = Number(pageId);
  const page = list.find((p) => p.id === id || p.id === pageId);
  return page?.url ?? null;
}
