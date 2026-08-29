/**
 * Guards for chrome-devtools MCP typing on X — long-form must stay on Article edit composer.
 * MCP agents must use `node scripts/cdp-type-if-article.mjs` instead of raw type_text / evaluate.
 */

import {
  assertXArticleEditUrl,
  assertXArticleHubUrl,
  assertXArticleUrlOrThrow,
  pageUrlFromList,
} from './assert-x-article-composer.mjs';

export {
  assertXArticleEditUrl,
  assertXArticleHubUrl,
  assertXArticleUrlOrThrow,
  pageUrlFromList,
};

/** Error token thrown in-browser when compose/post is open. */
export const X_ARTICLE_ONLY_ERROR = 'X_ARTICLE_ONLY';

/**
 * In-browser guard before insertText / typing evaluate.
 * Typing requires compose/articles/edit/<numericId> — not hub, not post, not public viewer.
 */
export const BROWSER_ARTICLE_URL_GUARD = `(function xArticleUrlGuard() {
  const href = (location.href || '').toLowerCase();
  if (/compose\\/post/.test(href)) {
    throw new Error('${X_ARTICLE_ONLY_ERROR}: compose/post forbidden');
  }
  if (/x\\.com\\/home(\\?|$|\\/)|twitter\\.com\\/home(\\?|$|\\/)/.test(href)) {
    throw new Error('${X_ARTICLE_ONLY_ERROR}: home timeline is not Article editor');
  }
  if (/\\/[^/]+\\/article\\/\\d+/.test(href) && !href.includes('compose/articles')) {
    throw new Error('${X_ARTICLE_ONLY_ERROR}: public article viewer — not composer');
  }
  if (/\\/compose\\/articles\\/?(?:\\?|$)/.test(href) && !/\\/compose\\/articles\\/edit\\/\\d+/.test(href)) {
    throw new Error('${X_ARTICLE_ONLY_ERROR}: hub only — click Create and wait for compose/articles/edit/<id>');
  }
  if (!/\\/compose\\/articles\\/edit\\/\\d+/.test(href)) {
    throw new Error('${X_ARTICLE_ONLY_ERROR}: typing requires compose/articles/edit/<id> — got ' + location.href);
  }
  return { ok: true, href: location.href };
})()`;

/** Prepend browser guard to an evaluate_script function body. */
export function wrapEvaluateWithArticleGuard(fnSource) {
  const src = String(fnSource).trim();
  return `(() => { ${BROWSER_ARTICLE_URL_GUARD}; return (${src}); })()`;
}

/** Node-side guard before delegating to chrome-devtools CLI (typing). */
export function assertNodeSideArticleUrl(url) {
  assertXArticleEditUrl(url);
}
