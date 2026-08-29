#!/usr/bin/env node
/**
 * Fill X Premium Article via official keyboard shortcuts (primary) + in-text markers.
 * Usage: node scripts/fill-x-article-shortcuts.mjs [--pageId=N] [--preview] [--submit]
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertXArticleUrl, pageUrlFromList } from './growth/lib/assert-x-article-composer.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const NODE22 = path.join(os.homedir(), '.nvm/versions/node/v22.22.0/bin');
const X_FILE = path.join(ROOT, 'docs/growth-content/2026-08-29-seo-essay-x.md');
const X_TITLE = 'Average position 1. Zero clicks. Our site had eight URLs and one identity.';
const EDIT_URL = 'https://x.com/compose/articles/edit/2093657683534745600';
const PUBLIC_URL = 'https://x.com/BuilderLiang/article/2093653160195948997';

const HEADINGS = new Set([
  'THE DIAGNOSIS TAKES ONE COMMAND',
  'FOUR ARTIFACTS, ONE SOURCE OF TRUTH',
  'THE TITLE PROBLEM WAS A PROMISE PROBLEM',
  "WHAT WE'RE BUILDING",
]);
const SUBHEADINGS = new Set([
  'TWO PLATFORM DEFAULTS, BOTH DOCUMENTED, BOTH EASY TO MISS',
  'TWO BUGS THAT ONLY EXIST IN SINGLE-PAGE APPS',
  "MAKE THE CRAWLER'S VIEW A TEST",
  'WHAT WE STOPPED DOING',
  'THE SCOREBOARD, HONESTLY',
  'THE CHECKLIST',
]);
const FOOTGUNS = [
  'A rewrite target of /index.html doesn\'t work, because Cloudflare 308-redirects *.html to its extension-less form, so an invisible rewrite becomes a redirect to the root.',
  'The splat in "/catalog/* → / 200" matches /catalog/ with an empty segment, so the catch-all silently shadowed the list-page shell we had just generated; it has to be /catalog/:id.',
  'We first sent unknown template IDs to a placeholder shell at /catalog/_item — because that path is a directory, Cloudflare 308\'d the bad ID onto /catalog/_item/, so we invented a brand-new crawlable junk URL while trying to clean up crawlable junk URLs.',
];
const NOT_DO = [
  'We don\'t claim "file viewer": it\'s a plausible high-volume phrase, we support ERD/PdMan/DBML import, and we do not ship a dedicated file viewer — ranking for a query you can\'t satisfy buys one visit and one bounce.',
  'We don\'t name Google Draw: our comparison page names draw.io because we have a real technical claim there, that a line in draw.io is a line while a relationship in ERD Online carries foreign-key semantics, and we won\'t name a product we haven\'t actually compared.',
  'We don\'t stuff the non-English queries we can see in the report, because impressions from an audience we don\'t serve in their language aren\'t a win.',
];
const CHECKLIST = [
  'Curl a non-homepage URL and grep for title and canonical; if you see your homepage, stop and fix that first.',
  'Curl a path that definitely doesn\'t exist; if it\'s 200, you have unbounded soft 404s, and on Cloudflare Pages the fix is a root 404.html.',
  'Delete the catch-all rewrite and enumerate the SPA paths that genuinely need a 200.',
  'Make sitemap, prerendered shells, host rewrites and self-host rewrites derive from one module.',
  'Check that hydration isn\'t overwriting per-path metadata your build just wrote.',
  'Check that JSON-LD @type is per-page rather than the homepage type with a swapped url.',
  'Pick one trailing-slash form and make canonical, sitemap, host redirect and legacy redirects all agree.',
  'Turn every one of those into a daily assertion against production, because this bug class is silent by construction.',
];

const applied = new Set();

function cdt(args) {
  const r = spawnSync('npx', ['-y', '--package=chrome-devtools-mcp', 'chrome-devtools', ...args], {
    env: { ...process.env, PATH: `${NODE22}:${process.env.PATH}` },
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || '').trim());
  return (r.stdout || '').trim();
}

function sleep(sec) {
  spawnSync('sleep', [String(sec)]);
}

function parseEval(raw) {
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

function evaluate(pageId, fn, args = []) {
  const cli = ['evaluate_script', fn, `--pageId=${pageId}`];
  if (args.length) cli.push(`--args=${JSON.stringify(args)}`);
  return parseEval(cdt([...cli, '--output-format=json']));
}

function press(pageId, key) {
  cdt(['press_key', String(pageId), key]);
}

function typeText(pageId, text) {
  // Leading "-" breaks CLI parsing; use insertText for those
  if (text.startsWith('-')) {
    evaluate(pageId, `(t) => {
      document.querySelector('[contenteditable="true"]')?.focus();
      document.execCommand('insertText', false, t);
      return { inserted: true };
    }`, [text]);
    return;
  }
  cdt(['type_text', String(pageId), text]);
}

function enter(pageId) {
  press(pageId, 'Enter');
  sleep(0.12);
}

function bodySize(pageId) {
  press(pageId, 'Meta+Shift+,');
  applied.add('Meta+Shift+, (decrease → Body)');
  sleep(0.1);
}

function selectPhrase(pageId, needle) {
  return evaluate(pageId, `(needle) => {
    const b = document.querySelector('[contenteditable="true"]');
    b?.focus();
    const full = b?.innerText || '';
    const idx = full.lastIndexOf(needle);
    if (idx < 0) return { found: false };
    const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT);
    let node, pos = 0, start, end;
    while ((node = w.nextNode())) {
      const len = node.textContent.length;
      if (!start && pos + len > idx) start = { node, off: idx - pos };
      if (start && pos + len >= idx + needle.length) { end = { node, off: idx + needle.length - pos }; break; }
      pos += len;
    }
    if (start && end) {
      const r = document.createRange();
      r.setStart(start.node, start.off);
      r.setEnd(end.node, end.off);
      const s = window.getSelection();
      s?.removeAllRanges();
      s?.addRange(r);
    }
    return { found: !!start, sel: window.getSelection()?.toString() };
  }`, [needle]);
}

function boldPhrase(pageId, phrase) {
  const s = selectPhrase(pageId, phrase);
  if (!s.found) return;
  press(pageId, 'Meta+B');
  applied.add('Meta+B');
  sleep(0.08);
}

function strikePhrase(pageId, phrase) {
  const s = selectPhrase(pageId, phrase);
  if (!s.found) return;
  press(pageId, 'Meta+Shift+X');
  applied.add('Meta+Shift+X');
  sleep(0.08);
}

function addLink(pageId, linkText, url) {
  const s = selectPhrase(pageId, linkText);
  if (!s.found) return;
  press(pageId, 'Meta+K');
  applied.add('Meta+K');
  sleep(0.35);
  typeText(pageId, url);
  sleep(0.15);
  press(pageId, 'Enter');
  sleep(0.2);
}

function clearEditor(pageId) {
  evaluate(pageId, `(title) => {
    const setNative = (el, v) => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    setNative(document.querySelector('textarea'), title);
    const b = document.querySelector('[contenteditable="true"]');
    b?.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    return { cleared: true };
  }`, [X_TITLE]);
}

function readParagraphs() {
  const text = fs.readFileSync(X_FILE, 'utf-8');
  const marker = '## X body (paste as-is, below the line)';
  const idx = text.indexOf(marker);
  if (idx === -1) throw new Error('X body marker not found');
  let body = text.slice(idx + marker.length).trim();
  const tagIdx = body.indexOf('\n---\n\n## Platform tag lines');
  if (tagIdx !== -1) body = body.slice(0, tagIdx).trim();
  return body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}

function exitQuoteOrList(pageId) {
  enter(pageId);
  enter(pageId);
}

function emitQuote(pageId, text) {
  typeText(pageId, `> ${text}`);
  applied.add('> (quote marker)');
  exitQuoteOrList(pageId);
}

function emitHeading(pageId, text, level = 1) {
  const prefix = level === 1 ? '# ' : '## ';
  typeText(pageId, `${prefix}${text}`);
  applied.add(level === 1 ? '# (Heading marker)' : '## (Subheading marker)');
  enter(pageId);
  bodySize(pageId);
}

function emitBullets(pageId, items) {
  press(pageId, 'Meta+Shift+7');
  applied.add('Meta+Shift+7 (bulleted list)');
  for (let i = 0; i < items.length; i++) {
    typeText(pageId, items[i]);
    if (i < items.length - 1) enter(pageId);
  }
  exitQuoteOrList(pageId);
}

function emitNumbers(pageId, items) {
  press(pageId, 'Meta+Shift+8');
  applied.add('Meta+Shift+8 (numbered list)');
  for (let i = 0; i < items.length; i++) {
    typeText(pageId, items[i]);
    if (i < items.length - 1) enter(pageId);
  }
  exitQuoteOrList(pageId);
}

function emitBody(pageId, text, { bold = [], strike = null } = {}) {
  bodySize(pageId);
  typeText(pageId, text);
  for (const p of bold) boldPhrase(pageId, p);
  if (strike) strikePhrase(pageId, strike);
  enter(pageId);
}

function openPage() {
  cdt(['new_page', EDIT_URL, '--timeout=45000']);
  sleep(4);
  const pages = JSON.parse(cdt(['list_pages', '--output-format=json']));
  const list = pages?.pages || pages;
  return (list.find((p) => p.url.includes('2093657683534745600')) || list[list.length - 1]).id;
}

function getPageHref(pageId) {
  try {
    const pages = JSON.parse(cdt(['list_pages', '--output-format=json']));
    const url = pageUrlFromList(pages, pageId);
    if (url) return url;
  } catch {
    /* fall through to live href */
  }
  const live = evaluate(pageId, `() => ({ href: location.href })`);
  return live?.href || '';
}

function requireArticleComposer(pageId) {
  assertXArticleUrl(getPageHref(pageId));
}

const pageIdArg = process.argv.find((a) => a.startsWith('--pageId='))?.slice(9);
const doPreview = process.argv.includes('--preview');
const doSubmit = process.argv.includes('--submit');

try {
  cdt(['status']);
  const pageId = pageIdArg ? Number(pageIdArg) : openPage();
  const paragraphs = readParagraphs();

  console.log(`pageId=${pageId} paragraphs=${paragraphs.length}`);
  requireArticleComposer(pageId);
  cdt(['navigate_page', String(pageId), 'reload', '--timeout=30000']);
  sleep(5);
  requireArticleComposer(pageId);
  clearEditor(pageId);
  sleep(0.5);

emitQuote(pageId, paragraphs[0]);

for (let i = 1; i < paragraphs.length; i++) {
  const para = paragraphs[i];

  if (para.startsWith('Three smaller footguns')) {
    emitBody(pageId, 'Three smaller footguns cost us a deploy each, and nobody writes these down.');
    emitBullets(pageId, FOOTGUNS);
    emitBody(pageId, 'Every one of those is a redirect rule that is almost right. That\'s the point: this class of bug produces a perfectly working website for humans and an unindexable one for crawlers, and no amount of reading your React code will surface it.');
    continue;
  }

  if (para.startsWith('Three things we deliberately did not do')) {
    emitBody(pageId, 'Three things we deliberately did not do, now written down as rules rather than left to judgment.');
    emitBullets(pageId, NOT_DO);
    continue;
  }

  if (para.startsWith('If you run a client-rendered site, these are worth thirty minutes.')) {
    emitHeading(pageId, 'THE CHECKLIST', 1);
    emitNumbers(pageId, CHECKLIST);
    continue;
  }

  if (HEADINGS.has(para)) {
    emitHeading(pageId, para, 1);
    continue;
  }

  if (SUBHEADINGS.has(para)) {
    emitHeading(pageId, para, 2);
    continue;
  }

  if (para === 'Rank was never the bottleneck. Being a distinct page was.') {
    emitQuote(pageId, para);
    continue;
  }

  if (para.startsWith('ERD Online is an open-source')) {
    emitHeading(pageId, "WHAT WE'RE BUILDING", 1);
    emitBody(pageId, para, { bold: ['ERD Online', 'Git + Figma for database design', 'projectJSON'] });
    continue;
  }

  if (para.startsWith('Open a real ER diagram')) {
    emitBody(pageId, 'Open a real ER diagram, read-only, no signup: erdonline.com/demo');
    addLink(pageId, 'erdonline.com/demo', 'https://www.erdonline.com/demo');
    enter(pageId);
    continue;
  }

  if (para.startsWith('Source, issues')) {
    emitBody(pageId, 'Source, issues, and the SEO scripts described above: github.com/erdonline/erdonline');
    addLink(pageId, 'github.com/erdonline/erdonline', 'https://github.com/erdonline/erdonline');
    enter(pageId);
    continue;
  }

  const bold = [];
  if (para.includes('one identity')) bold.push('one identity');
  if (para.includes('ERD Online')) bold.push('ERD Online');
  if (para.includes('Cloudflare Pages')) bold.push('Cloudflare Pages');
  if (para.includes('UmiJS')) bold.push('UmiJS');

  const strike = para.includes('write more content') ? 'write more content' : null;
  emitBody(pageId, para, { bold, strike });

  if ((i + 1) % 10 === 0) console.log(`  ${i + 1}/${paragraphs.length}`);
}

sleep(8);
const fill = evaluate(pageId, `() => {
  const b = document.querySelector('[contenteditable="true"]');
  const text = b?.innerText || '';
  const blocks = [...b?.querySelectorAll('[data-block=true]') || []];
  return {
    href: location.href,
    bodyLen: text.length,
    words: (document.body.innerText.match(/\\d+ words/) || [])[0],
    h1: blocks.filter(x => x.tagName === 'H1').length,
    h2: blocks.filter(x => x.className?.includes('header-two')).length,
    blockquote: blocks.filter(x => x.tagName === 'BLOCKQUOTE').length,
    unstyled: blocks.filter(x => x.className?.includes('unstyled')).length,
    tripleBlocks: (text.match(/\\n{3,}/g) || []).length,
  };
}`);
console.log('fill:', JSON.stringify(fill, null, 2));

let previewOk = false;
if (doPreview || doSubmit) {
  evaluate(pageId, `() => { document.querySelector('a[href*="/preview"]')?.click(); return { ok: true }; }`);
  sleep(10);
  const preview = evaluate(pageId, `() => {
    const text = (document.querySelector('article') || document.body)?.innerText || '';
    return {
      href: location.href,
      isPreview: location.href.includes('/preview'),
      articleLen: text.length,
      tripleBlocks: (text.match(/\\n{3,}/g) || []).length,
      hasSearchConsole: text.includes('Search Console'),
      hasGithub: text.includes('github.com/erdonline'),
      spacingOk: (text.match(/\\n{3,}/g) || []).length <= 2 && text.length > 8000,
    };
  }`);
  console.log('preview:', JSON.stringify(preview, null, 2));
  previewOk = preview.isPreview && preview.spacingOk && preview.hasSearchConsole && preview.articleLen > 8000;
  if (preview.isPreview) {
    evaluate(pageId, `() => { history.back(); return { href: location.href }; }`);
    sleep(3);
  }
  if (doSubmit && !previewOk) {
    console.error('Preview failed — not submitting');
    process.exit(1);
  }
}

if (doSubmit) {
  evaluate(pageId, `() => {
    [...document.querySelectorAll('button')].find(b => /^Publish$/i.test(b.innerText.trim()) && !b.closest('[role="dialog"]'))?.click();
    return { step: 'toolbar' };
  }`);
  sleep(2);
  evaluate(pageId, `() => {
    [...document.querySelectorAll('button')].filter(b => /^Publish$/i.test(b.innerText.trim())).pop()?.click();
    return { href: location.href };
  }`);
  sleep(15);
}

cdt(['new_page', PUBLIC_URL, '--timeout=45000']);
sleep(5);
const pages = JSON.parse(cdt(['list_pages', '--output-format=json']));
const list = pages?.pages || pages;
const pub = list.find((p) => p.url.includes('2093653160195948997') && p.url.includes('/article/'));
const verify = evaluate(pub?.id || pageId, `() => {
  const text = (document.querySelector('article') || document.body)?.innerText || '';
  return { href: location.href, articleLen: text.length, hasSearchConsole: text.includes('Search Console'), hasGithub: text.includes('github.com/erdonline') };
}`);
console.log('public:', JSON.stringify(verify, null, 2));
console.log('shortcuts_used:', [...applied].sort().join('; '));
console.log('preview_ok:', doPreview || doSubmit ? previewOk : 'skipped');
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
