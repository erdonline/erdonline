/**
 * Guarded chrome-devtools transport + URL guards + unique observe() for X Article fill.
 */

import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {
  assertXArticleEditUrl,
  assertXArticleHubUrl,
  pageUrlFromList,
} from './assert-x-article-composer.mjs';

const NODE22 = path.join(os.homedir(), '.nvm/versions/node/v22.22.0/bin');

let editorAttachedThisRun = false;

export function markEditorAttached() {
  editorAttachedThisRun = true;
}

export function resetEditorAttached() {
  editorAttachedThisRun = false;
}

/** @deprecated use markEditorAttached */
export function markCreateClicked() {
  markEditorAttached();
}

/** @deprecated use resetEditorAttached */
export function resetCreateClicked() {
  resetEditorAttached();
}

export function assertEditorAttached() {
  if (!editorAttachedThisRun) {
    throw new Error(
      [
        'HARD STOP: editor not attached this run.',
        'Call attachEditor() on compose/articles/edit/{id} before type_text / press_key.',
        'Keystrokes without attach hit Post composer / global tweet box.',
      ].join('\n'),
    );
  }
}

/** Error token thrown in-browser when compose/post is open. */
export const X_ARTICLE_ONLY_ERROR = 'X_ARTICLE_ONLY';

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
    throw new Error('${X_ARTICLE_ONLY_ERROR}: hub only — open compose/articles/edit/<id>');
  }
  if (!/\\/compose\\/articles\\/edit\\/\\d+/.test(href)) {
    throw new Error('${X_ARTICLE_ONLY_ERROR}: typing requires compose/articles/edit/<id> — got ' + location.href);
  }
  return { ok: true, href: location.href };
})()`;

export function wrapEvaluateWithArticleGuard(fnSource) {
  const src = String(fnSource).trim();
  return `(() => { ${BROWSER_ARTICLE_URL_GUARD}; return (${src}); })()`;
}

export function cdt(args) {
  const r = spawnSync('npx', ['-y', '--package=chrome-devtools-mcp', 'chrome-devtools', ...args], {
    env: { ...process.env, PATH: `${NODE22}:${process.env.PATH}` },
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || '').trim());
  return (r.stdout || '').trim();
}

export function parseEval(raw) {
  if (typeof raw === 'object' && raw !== null) {
    if (raw.href !== undefined || raw.bodyLength !== undefined) return raw;
  }
  const text = typeof raw === 'string' ? raw : JSON.stringify(raw);
  try {
    const outer = JSON.parse(text);
    if (outer && typeof outer.message === 'string') {
      const inner = outer.message.match(/```json\n([\s\S]*?)\n```/);
      if (inner) return JSON.parse(inner[1]);
    }
  } catch {
    /* not JSON envelope */
  }
  const m = text.match(/```json\n([\s\S]*?)\n```/);
  try {
    return JSON.parse(m ? m[1] : text);
  } catch {
    return { raw: text };
  }
}

export function getPageHref(pageId) {
  try {
    const live = parseEval(
      cdt(['evaluate_script', `() => ({ href: location.href })`, `--pageId=${pageId}`, '--output-format=json']),
    );
    if (live?.href) return live.href;
  } catch {
    /* fall through */
  }
  try {
    const pages = JSON.parse(cdt(['list_pages', '--output-format=json']));
    return pageUrlFromList(pages, pageId) || '';
  } catch {
    return '';
  }
}

export function requireArticleHub(pageId) {
  assertXArticleHubUrl(getPageHref(pageId));
}

export function requireArticleComposer(pageId) {
  const href = getPageHref(pageId);
  try {
    assertXArticleEditUrl(href);
  } catch {
    assertXArticleHubUrl(href);
  }
}

export function requireArticleEditEditor(pageId) {
  assertXArticleEditUrl(getPageHref(pageId));
}

export function evaluate(pageId, fn, args = [], { typing = false, stableDom = false } = {}) {
  if (typing) {
    assertEditorAttached();
    requireArticleEditEditor(pageId);
  }
  const fnSrc = String(fn).trim();
  const script = args.length
    ? `() => (${fnSrc})(${args.map((a) => JSON.stringify(a)).join(', ')})`
    : fnSrc;
  const body = typing ? wrapEvaluateWithArticleGuard(script) : script;
  const cli = ['evaluate_script', body, `--pageId=${pageId}`, `--waitForStableDom=${stableDom}`];
  return parseEval(cdt([...cli, '--output-format=json']));
}

export function press(pageId, key) {
  assertEditorAttached();
  requireArticleEditEditor(pageId);
  cdt(['press_key', String(pageId), key]);
}

export function sleep(sec) {
  spawnSync('sleep', [String(sec)]);
}

/** @typedef {{
 *   href: string,
 *   isArticleEdit: boolean,
 *   isPostComposer: boolean,
 *   titleValue: string,
 *   titleLen: number,
 *   blockCount: number,
 *   bodyLength: number,
 *   bodyHead: string,
 *   bodyTail: string,
 *   firstBlockText: string,
 *   lastBlockText: string,
 *   h2Count: number,
 *   blockquoteCount: number,
 *   strongCount: number,
 *   boldSpanCount: number,
 *   boldCount: number,
 *   linkCount: number,
 *   codeBlockCount: number,
 *   tableCount: number,
 *   dropdownOpen: boolean,
 *   styleHint: string|null,
 *   toggles: { bold: boolean, italic: boolean, strike: boolean, quote: boolean, ul: boolean, ol: boolean }
 * }} ObserveSnapshot */

const OBSERVE_FN = `() => {
  const href = location.href;
  const isArticleEdit = /\\/compose\\/articles\\/edit\\/\\d+/.test(href);
  const isPostComposer = /compose\\/post/.test(href);

  const titleEl =
    document.querySelector('textarea[name="Article Title"]') ||
    document.querySelector('textarea[placeholder="Add a title"]');
  const titleValue = titleEl?.value || '';
  const titleLen = titleValue.length;

  const dropdownOpen = !!document.querySelector('[data-testid="Dropdown"]');

  const styleBtn = [...document.querySelectorAll('#toolbar-styling-buttons button')].find(
    (b) => /^(Heading|Subheading|Body)$/i.test(b.innerText?.trim()),
  );
  const styleHint = styleBtn ? styleBtn.innerText.trim() : null;

  const toggleIds = ['btn-bold', 'btn-italic', 'btn-strikethrough', 'btn-blockquote', 'btn-ul', 'btn-ol'];
  const keyMap = {
    'btn-bold': 'bold',
    'btn-italic': 'italic',
    'btn-strikethrough': 'strike',
    'btn-blockquote': 'quote',
    'btn-ul': 'ul',
    'btn-ol': 'ol',
  };
  const toggles = { bold: false, italic: false, strike: false, quote: false, ul: false, ol: false };
  for (const id of toggleIds) {
    const btn = document.querySelector('[data-testid="' + id + '"]');
    toggles[keyMap[id]] = btn?.getAttribute('aria-pressed') === 'true';
  }

  const root = document.querySelector('[contenteditable="true"]');
  const blocks = [...root?.querySelectorAll('[data-block=true]') || []];
  let blockCount = blocks.length;
  const rootText = (root?.innerText || '').replace(/\\n$/, '');
  const bodyLength = rootText.length;
  const bodyHead = rootText.slice(0, 200);
  const bodyTail = rootText.slice(-200);
  let firstBlockText = (blocks[0]?.innerText || '').replace(/\\n$/, '').slice(0, 200);
  let lastBlockText = (blocks[blockCount - 1]?.innerText || '').replace(/\\n$/, '').slice(0, 200);
  if (blockCount === 0 && rootText) {
    blockCount = 1;
    firstBlockText = rootText.slice(0, 200);
    lastBlockText = rootText.slice(0, 200);
  }

  const h2Count = blocks.filter((b) => b.tagName === 'H2').length;
  const blockquoteCount = blocks.filter((b) => b.tagName === 'BLOCKQUOTE').length;
  const strongCount = root?.querySelectorAll('strong, b').length ?? 0;
  const boldSpanCount = root
    ? [...root.querySelectorAll('span[style*="font-weight"]')].filter((el) => {
      const fw = el.style?.fontWeight || '';
      return /bold/i.test(fw) || (parseInt(fw, 10) || 0) >= 600;
    }).length
    : 0;
  const boldCount = strongCount + boldSpanCount;
  const linkCount = root?.querySelectorAll('a[href]').length ?? 0;
  const codeBlockCount = root?.querySelectorAll('pre, [class*="code"], section pre').length ?? 0;
  const tableCount = root?.querySelectorAll('table').length ?? 0;

  return {
    href,
    isArticleEdit,
    isPostComposer,
    titleValue,
    titleLen,
    blockCount,
    bodyLength,
    bodyHead,
    bodyTail,
    firstBlockText,
    lastBlockText,
    h2Count,
    blockquoteCount,
    strongCount,
    boldSpanCount,
    boldCount,
    linkCount,
    codeBlockCount,
    tableCount,
    dropdownOpen,
    styleHint,
    toggles,
  };
}`;

/** Unique observe — snapshot v2 fields only. */
export function observe(pageId) {
  return evaluate(pageId, OBSERVE_FN, [], { stableDom: false });
}

/** @deprecated use observe */
export function observeArticleEditor(pageId) {
  return observe(pageId);
}

export function ensureDropdownClosed(pageId, obs) {
  let o = obs ?? observe(pageId);
  let attempts = 0;
  while (o.dropdownOpen && attempts < 6) {
    assertEditorAttached();
    requireArticleEditEditor(pageId);
    press(pageId, 'Escape');
    sleep(0.12);
    o = observe(pageId);
    attempts++;
  }
  return o;
}

export function preflightArticleEditor(pageId) {
  const obs = observe(pageId);
  if (obs.isPostComposer) {
    throw new Error(`HARD STOP preflight: compose/post — Article edit only. href=${obs.href}`);
  }
  if (!obs.isArticleEdit) {
    throw new Error(`HARD STOP preflight: not compose/articles/edit/{id} — href=${obs.href}`);
  }
  if (obs.titleLen === undefined) {
    throw new Error('HARD STOP preflight: title textarea missing');
  }
  return {
    ok: true,
    href: obs.href,
    titleLen: obs.titleLen,
    blockCount: obs.blockCount,
    draftOnly: true,
  };
}
