#!/usr/bin/env node
/**
 * Fill X Premium Article via WYSIWYG toolbar (#toolbar-styling-buttons).
 * Size dropdown + btn-bold/blockquote/ul/ol/link; Preview before publish.
 *
 * Usage:
 *   node scripts/fill-x-article-wysiwyg.mjs [--pageId=N] [--edit-url=URL] [--preview] [--submit]
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
const DEFAULT_EDIT_URL = 'https://x.com/compose/articles/edit/2093657683534745600';
const PUBLIC_URL = 'https://x.com/BuilderLiang/article/2093653160195948997';

const HEADING_SET = new Set([
  'THE DIAGNOSIS TAKES ONE COMMAND',
  'FOUR ARTIFACTS, ONE SOURCE OF TRUTH',
  'THE TITLE PROBLEM WAS A PROMISE PROBLEM',
  "WHAT WE'RE BUILDING",
]);

const SUBHEADING_SET = new Set([
  'TWO PLATFORM DEFAULTS, BOTH DOCUMENTED, BOTH EASY TO MISS',
  'TWO BUGS THAT ONLY EXIST IN SINGLE-PAGE APPS',
  "MAKE THE CRAWLER'S VIEW A TEST",
  'WHAT WE STOPPED DOING',
  'THE SCOREBOARD, HONESTLY',
  'THE CHECKLIST',
]);

const FOOTGUN_ITEMS = [
  'A rewrite target of /index.html doesn\'t work, because Cloudflare 308-redirects *.html to its extension-less form, so an invisible rewrite becomes a redirect to the root.',
  'The splat in "/catalog/* → / 200" matches /catalog/ with an empty segment, so the catch-all silently shadowed the list-page shell we had just generated; it has to be /catalog/:id.',
  'We first sent unknown template IDs to a placeholder shell at /catalog/_item — because that path is a directory, Cloudflare 308\'d the bad ID onto /catalog/_item/, so we invented a brand-new crawlable junk URL while trying to clean up crawlable junk URLs.',
];

const NOT_DO_ITEMS = [
  'We don\'t claim "file viewer": it\'s a plausible high-volume phrase, we support ERD/PdMan/DBML import, and we do not ship a dedicated file viewer — ranking for a query you can\'t satisfy buys one visit and one bounce.',
  'We don\'t name Google Draw: our comparison page names draw.io because we have a real technical claim there, that a line in draw.io is a line while a relationship in ERD Online carries foreign-key semantics, and we won\'t name a product we haven\'t actually compared.',
  'We don\'t stuff the non-English queries we can see in the report, because impressions from an audience we don\'t serve in their language aren\'t a win.',
];

const CHECKLIST_ITEMS = [
  'Curl a non-homepage URL and grep for title and canonical; if you see your homepage, stop and fix that first.',
  'Curl a path that definitely doesn\'t exist; if it\'s 200, you have unbounded soft 404s, and on Cloudflare Pages the fix is a root 404.html.',
  'Delete the catch-all rewrite and enumerate the SPA paths that genuinely need a 200.',
  'Make sitemap, prerendered shells, host rewrites and self-host rewrites derive from one module.',
  'Check that hydration isn\'t overwriting per-path metadata your build just wrote.',
  'Check that JSON-LD @type is per-page rather than the homepage type with a swapped url.',
  'Pick one trailing-slash form and make canonical, sitemap, host redirect and legacy redirects all agree.',
  'Turn every one of those into a daily assertion against production, because this bug class is silent by construction.',
];

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

function sleep(sec) {
  spawnSync('sleep', [String(sec)]);
}

function parseEval(raw) {
  let text = raw;
  if (typeof raw === 'object' && raw !== null) {
    if (raw.href !== undefined || raw.error !== undefined || raw.blocks !== undefined) return raw;
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
  const cliArgs = ['evaluate_script', fn, `--pageId=${pageId}`];
  if (args.length) cliArgs.push(`--args=${JSON.stringify(args)}`);
  return parseEval(cdt(cliArgs, { json: true }));
}

function pressEnter(pageId) {
  cdt(['press_key', String(pageId), 'Enter']);
}

function snapshot(pageId) {
  return cdt(['take_snapshot', String(pageId)]);
}

function menuUid(snapshotText, label) {
  const re = new RegExp(`uid=([^\\s]+)\\s+menuitem "${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`);
  const m = snapshotText.match(re);
  if (!m) throw new Error(`menuitem "${label}" not found in snapshot`);
  return m[1];
}

function openSizeMenu(pageId) {
  evaluate(pageId, `() => {
    const btn = [...document.querySelector("#toolbar-styling-buttons")?.querySelectorAll("button") || []]
      .find(b => /^(Heading|Subheading|Body)$/i.test(b.innerText?.trim()));
    btn?.click();
    return { opened: !!btn, current: btn?.innerText?.trim() };
  }`);
  sleep(0.35);
}

function currentSize(pageId) {
  return evaluate(pageId, `() => {
    const btn = [...document.querySelector("#toolbar-styling-buttons")?.querySelectorAll("button") || []]
      .find(b => /^(Heading|Subheading|Body)$/i.test(b.innerText?.trim()));
    return { size: btn?.innerText?.trim() || null };
  }`).size;
}

function setSize(pageId, size) {
  if (currentSize(pageId) === size) return;
  for (let attempt = 0; attempt < 3; attempt++) {
    openSizeMenu(pageId);
    const snap = snapshot(pageId);
    try {
      cdt(['click', String(pageId), menuUid(snap, size)]);
    } catch (e) {
      if (attempt === 2) throw e;
      sleep(0.5);
      continue;
    }
    sleep(0.35);
    if (currentSize(pageId) === size) return;
  }
  // Proceed even if toolbar label lagging — block type follows last menu pick
  console.warn(`setSize(${size}): toolbar label not confirmed, continuing`);
}

function tbClick(pageId, testid) {
  evaluate(pageId, `() => {
    document.querySelector('[data-testid="${testid}"]')?.click();
    return { clicked: true };
  }`);
}

function insertText(pageId, text) {
  evaluate(pageId, `(t) => {
    const bodyEl = document.querySelector('[contenteditable="true"]');
    bodyEl?.focus();
    document.execCommand('insertText', false, t);
    bodyEl?.dispatchEvent(new Event('input', { bubbles: true }));
    return { len: bodyEl?.innerText?.length ?? 0 };
  }`, [text]);
}

function selectSubstring(pageId, needle) {
  return evaluate(pageId, `(needle) => {
    const bodyEl = document.querySelector('[contenteditable="true"]');
    bodyEl?.focus();
    const full = bodyEl?.innerText || '';
    const idx = full.lastIndexOf(needle);
    if (idx < 0) return { found: false };
    const walker = document.createTreeWalker(bodyEl, NodeFilter.SHOW_TEXT);
    let node, pos = 0, start = null, end = null;
    while ((node = walker.nextNode())) {
      const len = node.textContent.length;
      if (!start && pos + len > idx) start = { node, offset: idx - pos };
      if (start && pos + len >= idx + needle.length) {
        end = { node, offset: idx + needle.length - pos };
        break;
      }
      pos += len;
    }
    if (start && end) {
      const range = document.createRange();
      range.setStart(start.node, start.offset);
      range.setEnd(end.node, end.offset);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    return { found: !!start, selected: window.getSelection()?.toString() };
  }`, [needle]);
}

function addLink(pageId, linkText, url) {
  const sel = selectSubstring(pageId, linkText);
  if (!sel.found) return { ok: false, reason: 'text not found' };
  tbClick(pageId, 'btn-link');
  sleep(0.4);
  const fill = evaluate(pageId, `(url) => {
    const input = document.querySelector('input[type="url"], input[placeholder*="URL" i], input[aria-label*="URL" i]')
      || [...document.querySelectorAll('input')].find(i => i.offsetParent && (i.placeholder || '').toLowerCase().includes('http'));
    if (!input) return { filled: false, inputs: document.querySelectorAll('input').length };
    const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    desc?.set?.call(input, url);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    const btn = [...document.querySelectorAll('button')].find(b => /^(Add|Apply|Save|OK)$/i.test(b.innerText?.trim()));
    btn?.click();
    return { filled: true, href: input.value };
  }`, [url]);
  sleep(0.3);
  return fill;
}

function clearEditor(pageId) {
  evaluate(pageId, `() => {
    const setNative = (el, v) => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const titleEl = document.querySelector('textarea[placeholder*="title" i], textarea[placeholder="Add a title"]');
    if (titleEl) setNative(titleEl, ${JSON.stringify(X_TITLE)});
    const bodyEl = document.querySelector('[contenteditable="true"]');
    bodyEl?.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('delete', false, null);
    return { cleared: true };
  }`);
  setSize(pageId, 'Body');
}

function isHeadingLine(line) {
  const t = line.trim();
  return HEADING_SET.has(t) || SUBHEADING_SET.has(t);
}

function headingSize(line) {
  const t = line.trim();
  if (HEADING_SET.has(t)) return 'Heading';
  if (SUBHEADING_SET.has(t)) return 'Subheading';
  return 'Body';
}

function readSourceParagraphs() {
  const text = fs.readFileSync(X_FILE, 'utf-8');
  const marker = '## X body (paste as-is, below the line)';
  const idx = text.indexOf(marker);
  if (idx === -1) throw new Error('X body marker not found');
  let body = text.slice(idx + marker.length).trim();
  const tagIdx = body.indexOf('\n---\n\n## Platform tag lines');
  if (tagIdx !== -1) body = body.slice(0, tagIdx).trim();
  return body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}

function applyInlineBold(pageId, paragraph, phrases) {
  for (const phrase of phrases) {
    if (!paragraph.includes(phrase)) continue;
    selectSubstring(pageId, phrase);
    tbClick(pageId, 'btn-bold');
    sleep(0.1);
  }
}

function emitBlockquote(pageId, text) {
  tbClick(pageId, 'btn-blockquote');
  setSize(pageId, 'Body');
  insertText(pageId, text);
  pressEnter(pageId);
  tbClick(pageId, 'btn-blockquote');
  setSize(pageId, 'Body');
}

function emitList(pageId, items, ordered = false) {
  setSize(pageId, 'Body');
  tbClick(pageId, ordered ? 'btn-ol' : 'btn-ul');
  for (let i = 0; i < items.length; i++) {
    insertText(pageId, items[i]);
    if (i < items.length - 1) pressEnter(pageId);
  }
  pressEnter(pageId);
  tbClick(pageId, ordered ? 'btn-ol' : 'btn-ul');
  setSize(pageId, 'Body');
}

function emitParagraph(pageId, text, { bold = [], strike = null } = {}) {
  setSize(pageId, 'Body');
  insertText(pageId, text);
  if (strike && text.includes(strike)) {
    selectSubstring(pageId, strike);
    tbClick(pageId, 'btn-strikethrough');
  }
  applyInlineBold(pageId, text, bold);
  pressEnter(pageId);
}

function emitHeading(pageId, text) {
  const size = headingSize(text);
  setSize(pageId, size);
  insertText(pageId, text);
  pressEnter(pageId);
  setSize(pageId, 'Body');
}

const pageIdArg = process.argv.find((a) => a.startsWith('--pageId='))?.slice(9);
const editUrl = process.argv.find((a) => a.startsWith('--edit-url='))?.slice(11) || DEFAULT_EDIT_URL;
const doPreview = process.argv.includes('--preview');
const doSubmit = process.argv.includes('--submit');

function openEditPage() {
  cdt(['new_page', editUrl, '--timeout=45000']);
  sleep(4);
  const pages = JSON.parse(cdt(['list_pages'], { json: true }));
  const list = pages?.pages || pages;
  const page = list.find((p) => p.url.includes(editUrl.split('/').pop())) || list[list.length - 1];
  return page.id;
}

const pageId = pageIdArg ? Number(pageIdArg) : openEditPage();
const paragraphs = readSourceParagraphs();
const applied = {
  size: ['Heading', 'Subheading', 'Body'],
  toolbar: new Set(),
};

console.log(`pageId=${pageId} paragraphs=${paragraphs.length}`);
clearEditor(pageId);

// Opening hook — blockquote
emitBlockquote(
  pageId,
  paragraphs[0],
);
applied.toolbar.add('btn-blockquote');

for (let i = 1; i < paragraphs.length; i++) {
  const para = paragraphs[i];
  if (para.startsWith('Three smaller footguns')) {
    emitParagraph(pageId, 'Three smaller footguns cost us a deploy each, and nobody writes these down.');
    emitList(pageId, FOOTGUN_ITEMS, false);
    applied.toolbar.add('btn-ul');
    emitParagraph(
      pageId,
      'Every one of those is a redirect rule that is almost right. That\'s the point: this class of bug produces a perfectly working website for humans and an unindexable one for crawlers, and no amount of reading your React code will surface it.',
    );
    continue;
  }

  if (para.startsWith('Three things we deliberately did not do')) {
    emitParagraph(pageId, 'Three things we deliberately did not do, now written down as rules rather than left to judgment.');
    emitList(pageId, NOT_DO_ITEMS, false);
    applied.toolbar.add('btn-ul');
    continue;
  }

  if (para.startsWith('If you run a client-rendered site, these are worth thirty minutes.')) {
    emitHeading(pageId, 'THE CHECKLIST');
    emitList(pageId, CHECKLIST_ITEMS, true);
    applied.toolbar.add('btn-ol');
    continue;
  }

  if (isHeadingLine(para)) {
    emitHeading(pageId, para);
    continue;
  }

  if (para === 'Rank was never the bottleneck. Being a distinct page was.') {
    emitBlockquote(pageId, para);
    applied.toolbar.add('btn-blockquote');
    continue;
  }

  if (para.startsWith('ERD Online is an open-source')) {
    emitHeading(pageId, "WHAT WE'RE BUILDING");
    emitParagraph(pageId, para, { bold: ['ERD Online', 'Git + Figma for database design', 'projectJSON'] });
    applied.toolbar.add('btn-bold');
    continue;
  }

  if (para.startsWith('Open a real ER diagram')) {
    emitParagraph(pageId, 'Open a real ER diagram, read-only, no signup: erdonline.com/demo', {});
    addLink(pageId, 'erdonline.com/demo', 'https://www.erdonline.com/demo');
    applied.toolbar.add('btn-link');
    continue;
  }

  if (para.startsWith('Source, issues')) {
    emitParagraph(pageId, 'Source, issues, and the SEO scripts described above: github.com/erdonline/erdonline', {});
    addLink(pageId, 'github.com/erdonline/erdonline', 'https://github.com/erdonline/erdonline');
    applied.toolbar.add('btn-link');
    continue;
  }

  const boldTerms = [];
  if (para.includes('one identity')) boldTerms.push('one identity');
  if (para.includes('ERD Online')) boldTerms.push('ERD Online');
  if (para.includes('Cloudflare Pages')) boldTerms.push('Cloudflare Pages');
  if (para.includes('UmiJS')) boldTerms.push('UmiJS');
  if (boldTerms.length) applied.toolbar.add('btn-bold');

  const strikePhrase = para.includes('write more content') ? 'write more content' : null;
  if (strikePhrase) applied.toolbar.add('btn-strikethrough');

  emitParagraph(pageId, para, { bold: boldTerms, strike: strikePhrase });
  if ((i + 1) % 8 === 0) console.log(`  ${i + 1}/${paragraphs.length} paragraphs`);
}

sleep(6);
const fill = evaluate(pageId, `() => {
  const bodyEl = document.querySelector('[contenteditable=true]');
  const text = bodyEl?.innerText || '';
  const blocks = [...bodyEl?.querySelectorAll('[data-block=true]') || []];
  return {
    href: location.href,
    bodyLen: text.length,
    words: (document.body.innerText.match(/\\d+ words/) || [])[0],
    h1: blocks.filter(b => b.tagName === 'H1').length,
    h2: blocks.filter(b => b.className?.includes('header-two')).length,
    blockquote: blocks.filter(b => b.tagName === 'BLOCKQUOTE').length,
    unstyled: blocks.filter(b => b.className?.includes('unstyled')).length,
    tripleBlocks: (text.match(/\\n{3,}/g) || []).length,
    publishDisabled: [...document.querySelectorAll('button')].find(b => b.innerText?.trim() === 'Publish')?.disabled,
    tail: text.slice(-120),
  };
}`);
console.log('fill:', JSON.stringify(fill, null, 2));

let previewOk = false;
if (doPreview || doSubmit) {
  evaluate(pageId, `() => { document.querySelector('a[href*="/preview"]')?.click(); return { clicked: true }; }`);
  sleep(8);
  const preview = evaluate(pageId, `() => {
    const article = document.querySelector('article') || document.body;
    const text = article?.innerText || '';
    return {
      href: location.href,
      isPreview: location.href.includes('/preview'),
      articleLen: text.length,
      tripleBlocks: (text.match(/\\n{3,}/g) || []).length,
      hasSearchConsole: text.includes('Search Console'),
      hasGithub: text.includes('github.com/erdonline'),
      hasBlockquoteFeel: text.includes('zero clicks'),
      spacingOk: (text.match(/\\n{3,}/g) || []).length <= 2 && text.length > 8000,
    };
  }`);
  console.log('preview:', JSON.stringify(preview, null, 2));
  previewOk = preview.isPreview && preview.spacingOk && preview.hasSearchConsole && preview.articleLen > 8000;
  if (!previewOk && doSubmit) {
    console.error('Preview check failed — not submitting');
    process.exit(1);
  }
  if (preview.isPreview) {
    evaluate(pageId, `() => { history.back(); return { href: location.href }; }`);
    sleep(3);
  }
}

if (doSubmit) {
  evaluate(pageId, `() => {
    [...document.querySelectorAll('button')].find(b => /^Publish$/i.test(b.innerText.trim()) && !b.closest('[role="dialog"]'))?.click();
    return { step: 'toolbar' };
  }`);
  sleep(2);
  evaluate(pageId, `() => {
    const btns = [...document.querySelectorAll('button')].filter(b => /^Publish$/i.test(b.innerText.trim()));
    btns[btns.length - 1]?.click();
    return { step: 'dialog', href: location.href };
  }`);
  sleep(12);
}

cdt(['new_page', PUBLIC_URL, '--timeout=45000']);
sleep(5);
const pages = JSON.parse(cdt(['list_pages'], { json: true }));
const list = pages?.pages || pages;
const pubPage = list.find((p) => p.url.includes('2093653160195948997') && p.url.includes('/article/'));
const verify = evaluate(pubPage?.id || pageId, `() => {
  const article = document.querySelector('article') || document.body;
  const text = article?.innerText || '';
  return {
    href: location.href,
    articleLen: text.length,
    spacingOk: (text.match(/\\n{3,}/g) || []).length <= 2,
    hasSearchConsole: text.includes('Search Console'),
    hasGithub: text.includes('github.com/erdonline'),
  };
}`);
console.log('public:', JSON.stringify(verify, null, 2));
console.log('applied_toolbar:', [...applied.toolbar].sort().join(', '));
console.log('preview_ok:', doPreview || doSubmit ? previewOk : 'skipped');
