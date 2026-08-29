#!/usr/bin/env node
/**
 * Fix X Premium article paragraph spacing (collapse triple newlines).
 * Usage: node scripts/fix-x-article-spacing.mjs [--pageId=93] [--submit]
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const NODE22 = path.join(os.homedir(), '.nvm/versions/node/v22.22.0/bin');
const X_FILE = path.join(ROOT, 'docs/growth-content/2026-08-29-seo-essay-x.md');
const X_TITLE = 'Average position 1. Zero clicks. Our site had eight URLs and one identity.';
const DRAFT_EDIT_ID = '2093652863440531456';
const DRAFT_EDIT_URL = `https://x.com/compose/articles/edit/${DRAFT_EDIT_ID}`;
const PUBLIC_URL = 'https://x.com/BuilderLiang/article/2093653160195948997';

function cdt(args, { json = false } = {}) {
  const cmdArgs = ['-y', '--package=chrome-devtools-mcp', 'chrome-devtools', ...args];
  if (json) cmdArgs.push('--output-format=json');
  const r = spawnSync('npx', cmdArgs, {
    env: { ...process.env, PATH: `${NODE22}:${process.env.PATH}` },
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || '').trim());
  return (r.stdout || '').trim();
}

function parseEval(raw) {
  let text = raw;
  if (typeof raw === 'object' && raw !== null) {
    if (raw.href !== undefined || raw.tripleOk !== undefined || raw.error !== undefined || raw.hasBodyEl !== undefined) {
      return raw;
    }
    text = raw.message ?? raw.result ?? JSON.stringify(raw);
  }
  const m = String(text).match(/```json\n([\s\S]*?)\n```/);
  try {
    return JSON.parse(m ? m[1] : text);
  } catch {
    return raw;
  }
}

function evaluate(pageId, fn) {
  const raw = cdt(['evaluate_script', fn, `--pageId=${pageId}`], { json: true });
  try {
    const parsed = JSON.parse(raw);
    return parseEval(parsed);
  } catch {
    return parseEval(raw);
  }
}

function readXBody() {
  const text = fs.readFileSync(X_FILE, 'utf-8');
  const marker = '## X body (paste as-is, below the line)';
  const idx = text.indexOf(marker);
  if (idx === -1) throw new Error('X body marker not found');
  let body = text.slice(idx + marker.length).trim();
  const tagIdx = body.indexOf('\n---\n\n## Platform tag lines');
  if (tagIdx !== -1) body = body.slice(0, tagIdx).trim();
  return body.replace(/\n{3,}/g, '\n\n').trim().replace(/\n\n/g, '\n');
}

function openEditPage() {
  cdt(['new_page', DRAFT_EDIT_URL, '--timeout=45000']);
  spawnSync('sleep', ['5']);
  const pages = JSON.parse(cdt(['list_pages'], { json: true }));
  const list = pages?.pages || pages;
  const page = list.find((p) => p.url.includes('2093652863440531456')) || list[list.length - 1];
  return page.id;
}

const submit = process.argv.includes('--submit');
const pageIdArg = process.argv.find((a) => a.startsWith('--pageId='))?.slice(9);
const editUrlArg = process.argv.find((a) => a.startsWith('--edit-url='))?.slice(11);
const body = readXBody();
const pageId = pageIdArg ? Number(pageIdArg) : openEditPage();
const payloadJson = JSON.stringify({ title: X_TITLE, body });

function assertEditUrl(pageId) {
  const expected = editUrlArg || DRAFT_EDIT_URL;
  const check = evaluate(pageId, `() => ({ href: location.href, ok: location.href.includes('/compose/articles/edit/') })`);
  if (!check.ok) throw new Error(`Wrong page for fill: ${check.href} (need compose/articles/edit/*)`);
  if (editUrlArg && !check.href.includes(editUrlArg.split('/').pop())) {
    throw new Error(`Wrong draft: ${check.href} (need ${editUrlArg})`);
  }
}

assertEditUrl(pageId);

const pre = evaluate(pageId, `() => {
  const bodyEl = document.querySelector('[contenteditable="true"][role="textbox"], [contenteditable="true"]');
  const titleEl = document.querySelector('textarea[placeholder*="Title" i], input[placeholder*="Title" i]');
  return {
    href: location.href,
    hasBodyEl: !!bodyEl,
    bodyLen: bodyEl?.innerText?.length ?? 0,
    tripleBlocks: ((bodyEl?.innerText || '').match(/\\n{3,}/g) || []).length,
    titleLen: titleEl?.value?.length ?? 0,
    hasUnpublish: !!document.body.innerText.includes('Unpublish, move to drafts'),
  };
}`);
console.log('pre:', pre);

if (pre.hasUnpublish) {
  evaluate(pageId, `() => {
    [...document.querySelectorAll('button')].find(b => /Unpublish, move to drafts/i.test(b.innerText))?.click();
    return { clicked: true };
  }`);
  spawnSync('sleep', ['2']);
  evaluate(pageId, `() => {
    [...document.querySelectorAll('button')].find(b => /^Unpublish, move to drafts$/i.test(b.innerText.trim()))?.click();
    return { confirmed: true };
  }`);
  spawnSync('sleep', ['5']);
}

const fill = evaluate(
  pageId,
  `() => {
    const { title, body } = ${payloadJson};
    const setNative = (el, value) => {
      if (!el) return false;
      const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    };
    const titleEl = document.querySelector('textarea[placeholder*="Title" i], input[placeholder*="Title" i]')
      || [...document.querySelectorAll('textarea')].find(t => (t.placeholder || '').toLowerCase().includes('title'));
    if (titleEl) setNative(titleEl, title);
    const bodyEl = document.querySelector('[contenteditable="true"][role="textbox"], [contenteditable="true"]');
    if (!bodyEl) return { error: 'no bodyEl', href: location.href };
    bodyEl.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    document.execCommand('insertText', false, body);
    const text = bodyEl.innerText || '';
    const tripleBlocks = (text.match(/\\n{3,}/g) || []).length;
    return {
      href: location.href,
      titleLen: titleEl?.value?.length ?? 0,
      bodyLen: text.length,
      expectedLen: body.length,
      tripleBlocks,
      tripleOk: tripleBlocks === 0,
      newlineCount: (text.match(/\\n/g) || []).length,
      possibleDuplicate: (() => {
        const v = text;
        const h = Math.floor(v.length / 2);
        return v.length > 100 && v.slice(0, h) === v.slice(h);
      })(),
      preview: text.slice(0, 120),
    };
  }`,
);
console.log('fill:', JSON.stringify(fill, null, 2));

if (!fill.tripleOk) {
  console.error('FAIL: triple newlines remain after fill');
  process.exit(1);
}

if (!submit) {
  console.log('Stopped before Publish (pass --submit to publish)');
  process.exit(0);
}

evaluate(pageId, `() => {
  const toolbar = [...document.querySelectorAll('button, [role="button"]')].find(b => /^Publish$/i.test(b.innerText?.trim()) && !b.closest('[role="dialog"]'));
  toolbar?.click();
  return { clickedToolbarPublish: !!toolbar };
}`);
spawnSync('sleep', ['2']);
evaluate(pageId, `() => {
  const dialog = [...document.querySelectorAll('button, [role="button"]')].find(b => /^Publish$/i.test(b.innerText?.trim()) && (b.closest('[role="dialog"]') || document.querySelector('h2')?.innerText?.includes('Publish Article')));
  dialog?.click();
  return { clickedDialogPublish: !!dialog, href: location.href };
}`);
spawnSync('sleep', ['12']);

cdt(['new_page', PUBLIC_URL, '--timeout=45000']);
spawnSync('sleep', ['5']);
const pages = JSON.parse(cdt(['list_pages'], { json: true }));
const list = pages?.pages || pages;
const pubPage = list.find((p) => p.url.includes('2093653160195948997') && p.url.includes('/article/'));
const verifyId = pubPage?.id || pageId;

const verify = evaluate(verifyId, `() => {
  const article = document.querySelector('article') || document.body;
  const text = article.innerText || '';
  const tripleBlocks = (text.match(/\\n{3,}/g) || []).length;
  const idx = text.indexOf('Search Console');
  const gapSample = text.slice(idx, idx + 400);
  return {
    href: location.href,
    articleLen: text.length,
    tripleBlocks,
    spacingOk: tripleBlocks === 0,
    gapSample,
  };
}`);
console.log('public verify:', JSON.stringify(verify, null, 2));
