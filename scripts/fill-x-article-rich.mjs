#!/usr/bin/env node
/**
 * Fill X Premium Article via WYSIWYG keyboard input (type_text triggers save).
 * Usage: node scripts/fill-x-article-rich.mjs --pageId=113 [--preview] [--submit]
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
const DRAFT_EDIT_URL = 'https://x.com/compose/articles/edit/2093657683534745600';

function cdt(...args) {
  const r = spawnSync('npx', ['-y', '--package=chrome-devtools-mcp', 'chrome-devtools', ...args, '--output-format=json'], {
    env: { ...process.env, PATH: `${NODE22}:${process.env.PATH}` },
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || '').trim());
  return r.stdout.trim();
}

function parseEval(raw) {
  let text = raw;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.href !== undefined || parsed.error !== undefined || parsed.blocks !== undefined) return parsed;
    text = parsed.message ?? raw;
  } catch { /* string */ }
  const m = String(text).match(/```json\n([\s\S]*?)\n```/);
  try {
    return JSON.parse(m ? m[1] : text);
  } catch {
    return { raw: text };
  }
}

function evaluate(pageId, fn) {
  return parseEval(cdt('evaluate_script', fn, `--pageId=${pageId}`));
}

function pressKey(pageId, key) {
  spawnSync('npx', ['-y', '--package=chrome-devtools-mcp', 'chrome-devtools', 'press_key', String(pageId), key], {
    env: { ...process.env, PATH: `${NODE22}:${process.env.PATH}` },
    encoding: 'utf-8',
  });
}

function typeText(pageId, text) {
  const r = spawnSync(
    'npx',
    ['-y', '--package=chrome-devtools-mcp', 'chrome-devtools', 'type_text', String(pageId), text],
    { env: { ...process.env, PATH: `${NODE22}:${process.env.PATH}` }, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 },
  );
  if (r.status !== 0) throw new Error(`type_text failed: ${(r.stderr || r.stdout || '').trim()}`);
}

function readSource() {
  const text = fs.readFileSync(X_FILE, 'utf-8');
  const marker = '## X body (paste as-is, below the line)';
  const idx = text.indexOf(marker);
  if (idx === -1) throw new Error('X body marker not found');
  let body = text.slice(idx + marker.length).trim();
  const tagIdx = body.indexOf('\n---\n\n## Platform tag lines');
  if (tagIdx !== -1) body = body.slice(0, tagIdx).trim();
  return body.replace(/\n{3,}/g, '\n\n').trim();
}

function isHeadingLine(line) {
  const t = line.trim();
  if (!t || t.length > 80) return false;
  if (/^curl\s/.test(t) || /^https?:/.test(t)) return false;
  const letters = t.replace(/[^A-Za-z]/g, '');
  return letters.length >= 8 && letters === letters.toUpperCase();
}

function parseBlocks(body) {
  const blocks = [];
  for (const para of body.split(/\n\n+/)) {
    const line = para.trim();
    if (!line) continue;
    blocks.push({ type: isHeadingLine(line) ? 'heading' : 'paragraph', text: line });
  }
  return blocks;
}

const pageId = Number(process.argv.find((a) => a.startsWith('--pageId='))?.slice(9));
const doPreview = process.argv.includes('--preview');
const doSubmit = process.argv.includes('--submit');
if (!pageId) throw new Error('--pageId required');

const blocks = parseBlocks(readSource());

// Title + clear body
evaluate(pageId, `() => {
  const setNative = (el, v) => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const titleEl = document.querySelector('textarea[placeholder*="title" i], textarea[placeholder="Add a title"]');
  if (titleEl) setNative(titleEl, ${JSON.stringify(X_TITLE)});
  const bodyEl = document.querySelector('[contenteditable="true"][role="textbox"], [contenteditable="true"]');
  bodyEl?.focus();
  document.execCommand('selectAll', false, null);
  document.execCommand('delete', false, null);
  // Ensure first block starts as Body paragraph, not inherited Heading
  const fmtBtn = [...document.querySelectorAll('button')].find(b => b.innerText?.trim() === 'Body');
  fmtBtn?.click();
  [...document.querySelectorAll('[role="menuitem"]')].find(m => m.innerText?.trim() === 'Body')?.click();
  bodyEl?.focus();
  return { href: location.href, cleared: true };
}`);

console.log(`Typing ${blocks.length} blocks via keyboard…`);
for (let i = 0; i < blocks.length; i++) {
  const block = blocks[i];
  const setBody = () => evaluate(pageId, `() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText?.trim() === 'Body');
    btn?.click();
    [...document.querySelectorAll('[role="menuitem"]')].find(m => m.innerText?.trim() === 'Body')?.click();
    document.querySelector('[contenteditable="true"]')?.focus();
    return { format: 'body' };
  }`);
  const setHeading = () => evaluate(pageId, `() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText?.trim() === 'Body');
    btn?.click();
    [...document.querySelectorAll('[role="menuitem"]')].find(m => m.innerText?.trim() === 'Heading')?.click();
    document.querySelector('[contenteditable="true"]')?.focus();
    return { format: 'heading' };
  }`);

  if (block.type === 'heading') {
    setHeading();
    typeText(pageId, block.text);
  } else {
    setBody();
    typeText(pageId, block.text);
  }
  if (i < blocks.length - 1) pressKey(pageId, 'Enter');
  // Enter creates a new block inheriting prior format — always reset to Body after heading
  if (block.type === 'heading') setBody();
  if ((i + 1) % 10 === 0) console.log(`  ${i + 1}/${blocks.length} blocks typed`);
}

spawnSync('sleep', ['8']);
const fill = evaluate(pageId, `() => {
  const bodyEl = document.querySelector('[contenteditable="true"]');
  const text = bodyEl?.innerText || '';
  return {
    href: location.href,
    bodyLen: text.length,
    words: (document.body.innerText.match(/\\d+ words/) || [])[0],
    h1Count: bodyEl?.querySelectorAll('h1').length ?? 0,
    h2Count: bodyEl?.querySelectorAll('h2').length ?? 0,
    bodyBlockCount: bodyEl?.querySelectorAll('.longform-unstyled, [class*="unstyled"]').length ?? 0,
    tripleBlocks: (text.match(/\\n{3,}/g) || []).length,
    lastSaved: (document.body.innerText.match(/Last saved[^\\n]+/) || [])[0],
    publishDisabled: [...document.querySelectorAll('button')].find(b => b.innerText?.trim() === 'Publish')?.disabled,
    fontSample: [...(bodyEl?.querySelectorAll('h1,div') || [])].slice(0, 4).map(el => ({
      tag: el.tagName, cls: el.className?.slice(0, 25), fs: getComputedStyle(el).fontSize
    })),
    tail: text.slice(-100),
  };
}`);
console.log('fill:', JSON.stringify(fill, null, 2));

if (doPreview) {
  evaluate(pageId, `() => { document.querySelector('a[href*="/preview"]')?.click(); return { clicked: true }; }`);
  spawnSync('sleep', ['10']);
  const preview = evaluate(pageId, `() => {
    const article = document.querySelector('article');
    const text = article?.innerText || '';
    const idx = text.indexOf('Search Console');
    return {
      href: location.href,
      articleLen: text.length,
      tripleBlocks: (text.match(/\\n{3,}/g) || []).length,
      hasSearchConsole: idx >= 0,
      hasGithub: text.includes('github.com/erdonline'),
      spacingOk: (text.match(/\\n{3,}/g) || []).length <= 2 && text.length > 8000,
      gapSample: idx >= 0 ? text.slice(idx, idx + 260) : text.slice(0, 260),
    };
  }`);
  console.log('preview:', JSON.stringify(preview, null, 2));
}

if (doSubmit) {
  evaluate(pageId, `() => {
    [...document.querySelectorAll('button')].find(b => /^Publish$/i.test(b.innerText.trim()))?.click();
    return { step: 'toolbar' };
  }`);
  spawnSync('sleep', ['2']);
  evaluate(pageId, `() => {
    const btns = [...document.querySelectorAll('button')].filter(b => /^Publish$/i.test(b.innerText.trim()));
    btns[btns.length - 1]?.click();
    return { step: 'dialog', href: location.href };
  }`);
  spawnSync('sleep', ['15']);
  const pub = evaluate(pageId, `() => ({ href: location.href }))`);
  console.log('published:', pub);
}
