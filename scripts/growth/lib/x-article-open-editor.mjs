/**
 * Reuse an open X Article edit tab — never Create.
 */

import {
  cdt,
  evaluate,
  getPageHref,
  markEditorAttached,
  sleep,
} from './x-article-cdp-guarded.mjs';
import {
  assertXArticleEditUrl,
  isXArticleEditUrl,
} from './assert-x-article-composer.mjs';

/** User gold-standard draft — read-only; never fill or drill here. */
export const GOLD_DRAFT_ID = '2093880046998130688';

/** Draft IDs that must never be filled by agent scripts. */
export const DENY_DRAFT_IDS = Object.freeze([GOLD_DRAFT_ID]);

const EDITOR_PROBE = `() => {
  const href = (location.href || '').toLowerCase();
  if (/compose\\/post/.test(href)) {
    return { ok: false, reason: 'compose/post', href: location.href };
  }
  const onEdit = /\\/compose\\/articles\\/edit\\/\\d+/.test(href);
  const title = document.querySelector('textarea[name="Article Title"]')
    || document.querySelector('textarea[placeholder="Add a title"]');
  const body = document.querySelector('[contenteditable="true"]');
  const toolbar = document.querySelector('#toolbar-styling-buttons');
  return {
    ok: onEdit && !!(title && body && (toolbar || onEdit)),
    href: location.href,
    onEdit,
    hasTitle: !!title,
    hasBody: !!body,
    hasToolbar: !!toolbar,
  };
}`;

function failOpen(detail) {
  throw new Error(
    [
      'HARD STOP: no usable X Article edit tab.',
      detail,
      'Open compose/articles/edit/<id> in Chrome — never Create from agent unless user asks.',
    ].join('\n'),
  );
}

function assertNotDeniedDraft(href) {
  for (const id of DENY_DRAFT_IDS) {
    if (href.includes(id)) {
      throw new Error(
        `HARD STOP: refusing denied draft ${id} — use sandbox edit tab via resolveEditPageId()`,
      );
    }
  }
}

export function findExistingEditPageId() {
  const pages = JSON.parse(cdt(['list_pages', '--output-format=json']));
  const list = pages?.pages || pages;
  const edits = list.filter((p) => /compose\/articles\/edit\/\d+/.test(p.url || ''));
  if (!edits.length) return null;
  const hit = edits.find((p) => p.selected) || edits[0];
  return hit.id;
}

/** Select existing edit tab; throw if none. Never clicks Create. Denies gold draft. */
export function resolveEditPageId(explicitPageId) {
  const pageId = explicitPageId ? Number(explicitPageId) : findExistingEditPageId();
  if (!pageId) {
    failOpen('No compose/articles/edit/{id} tab found.');
  }
  cdt(['select_page', String(pageId)]);
  sleep(0.3);
  const href = getPageHref(pageId);
  assertNotDeniedDraft(href);
  if (!isXArticleEditUrl(href)) {
    failOpen(`pageId=${pageId} is not on edit URL: ${href}`);
  }
  return pageId;
}

/** Verify edit composer; mark editor attached so guarded type paths work on reused tab. */
export function attachEditor(pageId) {
  const href = getPageHref(pageId);
  assertNotDeniedDraft(href);
  const state = evaluate(pageId, EDITOR_PROBE);
  if (!state.ok) failOpen(JSON.stringify(state));
  assertXArticleEditUrl(getPageHref(pageId));
  markEditorAttached();
  return state;
}

/** @deprecated use attachEditor */
export function attachToEditEditor(pageId) {
  return attachEditor(pageId);
}
