/**
 * Guarded chrome-devtools helpers for X Article fill scripts.
 * Every type / key / typing evaluate calls requireArticleComposer first.
 */

import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {
  assertXArticleEditUrl,
  assertXArticleHubUrl,
  pageUrlFromList,
  wrapEvaluateWithArticleGuard,
} from './chrome-devtools-type-guard.mjs';

const NODE22 = path.join(os.homedir(), '.nvm/versions/node/v22.22.0/bin');

let createClickedThisRun = false;

export function markCreateClicked() {
  createClickedThisRun = true;
}

export function resetCreateClicked() {
  createClickedThisRun = false;
}

function assertCreateClickedBeforeInput() {
  if (!createClickedThisRun) {
    throw new Error(
      [
        'HARD STOP: Create was not clicked this run.',
        'On compose/articles you must click button[aria-label="create"] before any type_text / press_key.',
        'Keystrokes without Create hit Post composer / global tweet box.',
      ].join('\n'),
    );
  }
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
  let text = raw;
  if (typeof raw === 'object' && raw !== null) {
    if (raw.href !== undefined || raw.isPreview !== undefined || raw.bodyLen !== undefined) return raw;
    text = raw.message ?? JSON.stringify(raw);
  }
  const m = String(text).match(/```json\n([\s\S]*?)\n```/);
  try {
    return JSON.parse(m ? m[1] : text);
  } catch {
    return { raw: text };
  }
}

export function getPageHref(pageId) {
  try {
    const pages = JSON.parse(cdt(['list_pages', '--output-format=json']));
    const url = pageUrlFromList(pages, pageId);
    if (url) return url;
  } catch {
    /* fall through */
  }
  const live = parseEval(
    cdt(['evaluate_script', `() => ({ href: location.href })`, `--pageId=${pageId}`, '--output-format=json']),
  );
  return live?.href || '';
}

export function requireArticleHub(pageId) {
  assertXArticleHubUrl(getPageHref(pageId));
}

/** Pre-create navigation / Create click — hub or already on edit. */
export function requireArticleComposer(pageId) {
  const href = getPageHref(pageId);
  try {
    assertXArticleEditUrl(href);
  } catch {
    assertXArticleHubUrl(href);
  }
}

/** Post-create — required before type_text / press_key. */
export function requireArticleEditEditor(pageId) {
  assertXArticleEditUrl(getPageHref(pageId));
}

export function evaluate(pageId, fn, args = [], { typing = false } = {}) {
  if (typing) requireArticleEditEditor(pageId);
  const body = typing ? wrapEvaluateWithArticleGuard(fn) : fn;
  const cli = ['evaluate_script', body, `--pageId=${pageId}`];
  if (args.length) cli.push(`--args=${JSON.stringify(args)}`);
  return parseEval(cdt([...cli, '--output-format=json']));
}

export function press(pageId, key) {
  assertCreateClickedBeforeInput();
  requireArticleEditEditor(pageId);
  cdt(['press_key', String(pageId), key]);
}

export function typeText(pageId, text) {
  assertCreateClickedBeforeInput();
  requireArticleEditEditor(pageId);
  if (text.startsWith('-') || text.startsWith('>') || text.startsWith('#')) {
    evaluate(
      pageId,
      `(t) => {
      document.querySelector('[contenteditable="true"]')?.focus();
      document.execCommand('insertText', false, t);
      return { inserted: true };
    }`,
      [text],
      { typing: true },
    );
    return;
  }
  cdt(['type_text', String(pageId), text]);
}

export function sleep(sec) {
  spawnSync('sleep', [String(sec)]);
}
