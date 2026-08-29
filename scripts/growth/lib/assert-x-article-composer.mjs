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
    `  2. node scripts/${ARTICLE_PATH} [--pageId=N] [--preview] [--submit]`,
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
    `  node scripts/${ARTICLE_PATH} [--pageId=N] [--preview] [--submit]`,
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
  if (/x\.com\/home(\?|$|\/)/.test(href) || /twitter\.com\/home(\?|$|\/)/.test(href)) {
    throw new Error(
      [
        'HARD STOP: home timeline tweet box is not X Article composer.',
        '',
        `Open ${ARTICLE_URL} (or compose/articles/edit/<id>) before fill script types.`,
      ].join('\n'),
    );
  }
  if (!href.includes('compose/articles') && !href.includes('/article/')) {
    throw new Error(
      [
        'HARD STOP: current page is not X Article composer.',
        `Got: ${url}`,
        `Expected URL containing compose/articles — open ${ARTICLE_URL} first.`,
      ].join('\n'),
    );
  }
}

export function pageUrlFromList(pagesJson, pageId) {
  const list = pagesJson?.pages || pagesJson;
  if (!Array.isArray(list)) return null;
  const id = Number(pageId);
  const page = list.find((p) => p.id === id || p.id === pageId);
  return page?.url ?? null;
}
