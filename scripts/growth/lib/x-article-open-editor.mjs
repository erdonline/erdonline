/**
 * Open X Article editor from compose/articles — must click Create before typing.
 * Locator: button[aria-label="create"] only (no css-* hashes).
 * After Create, URL must become compose/articles/edit/<id> before any keystroke.
 */

import {
  cdt,
  evaluate,
  getPageHref,
  markCreateClicked,
  requireArticleComposer,
  requireArticleEditEditor,
  sleep,
} from './x-article-cdp-guarded.mjs';
import {
  assertXArticleEditUrl,
  assertXArticleHubUrl,
  isXArticleEditUrl,
  X_ARTICLE_EDIT_URL_RE,
} from './assert-x-article-composer.mjs';
import { ARTICLE_COMPOSE_URL } from './x-article-publish-lib.mjs';

const EDITOR_PROBE = `() => {
  const href = (location.href || '').toLowerCase();
  if (/compose\\/post/.test(href)) {
    return { ok: false, reason: 'compose/post', href: location.href };
  }
  const onEdit = /\\/compose\\/articles\\/edit\\/\\d+/.test(href);
  const title = document.querySelector('textarea');
  const body = document.querySelector('[contenteditable="true"]');
  const toolbar = document.querySelector('#toolbar-styling-buttons');
  return {
    ok: onEdit && !!(title && body && (toolbar || onEdit)),
    href: location.href,
    onEdit,
    hasCreate: !!document.querySelector('button[aria-label="create"]'),
    hasTitle: !!title,
    hasBody: !!body,
    hasToolbar: !!toolbar,
  };
}`;

const CLICK_CREATE = `() => {
  const btn = document.querySelector('button[aria-label="create"]');
  if (!btn) return { clicked: false, reason: 'button[aria-label="create"] not found' };
  btn.click();
  return { clicked: true };
}`;

function failOpen(detail) {
  throw new Error(
    [
      'HARD STOP: X Article editor not open — keystrokes would hit Post / wrong surface.',
      '',
      detail,
      `Open ${ARTICLE_COMPOSE_URL} → button[aria-label="create"] → wait for compose/articles/edit/<id>.`,
      'Example: https://x.com/compose/articles/edit/2093728235884605440',
    ].join('\n'),
  );
}

/** Poll until href matches X_ARTICLE_EDIT_URL_RE (max ~20s). */
export function waitForEditUrl(pageId, maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    const href = getPageHref(pageId);
    if (isXArticleEditUrl(href)) {
      assertXArticleEditUrl(href);
      return href;
    }
    sleep(1);
  }
  const last = getPageHref(pageId);
  failOpen(
    `Create click did not land on edit URL within ${maxAttempts}s. Last href: ${last}. Expected: ${X_ARTICLE_EDIT_URL_RE}`,
  );
}

/** Click Create (if needed) and verify edit composer is ready. Sets createClicked flag. */
export function openArticleEditor(pageId) {
  const href = getPageHref(pageId);

  if (isXArticleEditUrl(href)) {
    const state = evaluate(pageId, EDITOR_PROBE);
    if (!state.ok) failOpen(JSON.stringify(state));
    assertXArticleEditUrl(getPageHref(pageId));
    markCreateClicked();
    return state;
  }

  assertXArticleHubUrl(href);

  const click = evaluate(pageId, CLICK_CREATE);
  if (!click.clicked) failOpen(click.reason || 'Create click failed');

  const editHref = waitForEditUrl(pageId);
  const state = evaluate(pageId, EDITOR_PROBE);
  if (!state.ok) failOpen(JSON.stringify({ ...state, editHref }));
  requireArticleEditEditor(pageId);
  markCreateClicked();
  return state;
}

export function openArticlesPage() {
  cdt(['new_page', ARTICLE_COMPOSE_URL, '--timeout=45000']);
  sleep(5);
  const pages = JSON.parse(cdt(['list_pages', '--output-format=json']));
  const list = pages?.pages || pages;
  const hit = list.find((p) => (p.url || '').includes('compose/articles'));
  const pageId = (hit || list[list.length - 1]).id;
  requireArticleComposer(pageId);
  openArticleEditor(pageId);
  return pageId;
}
