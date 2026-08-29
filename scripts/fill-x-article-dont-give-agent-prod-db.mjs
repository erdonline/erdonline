#!/usr/bin/env node
/**
 * Fill X Premium Article — Job 1: dont-give-agent-prod-db
 * Usage: node scripts/fill-x-article-dont-give-agent-prod-db.mjs [--pageId=N] [--preview] [--submit]
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
const X_FILE = path.join(ROOT, 'docs/growth-content/dont-give-agent-prod-db-x.md');
const X_TITLE = "Don't give your agent the production database";
const COMPOSE_URL = 'https://x.com/compose/articles';

const HEADINGS = new Set([
  'THIS FAILURE HAS A NAME: INVENTED COLUMN',
  'THREE THINGS YOU ALREADY TRIED',
  'LIVE CATALOG ONLY GETS YOU HALWAY',
  'LIVE CATALOG ONLY GETS YOU HALFWAY',
  'SWAP THE FACT SOURCE: READ THE CONTRACT, NOT PRODUCTION',
  'PROGRESSIVE DISCLOSURE, NOT A FULL DUMP',
  'THE CTA IS NOT "INSTALL OUR MCP"',
]);

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
  if (text.startsWith('-') || text.startsWith('>') || text.startsWith('#')) {
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
  return text
    .slice(idx + marker.length)
    .trim()
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
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

function emitHeading(pageId, text) {
  typeText(pageId, `# ${text}`);
  applied.add('# (Heading marker)');
  enter(pageId);
  bodySize(pageId);
}

function emitBody(pageId, text, { bold = [] } = {}) {
  bodySize(pageId);
  typeText(pageId, text);
  for (const p of bold) boldPhrase(pageId, p);
  enter(pageId);
}

function openPage() {
  cdt(['new_page', COMPOSE_URL, '--timeout=45000']);
  sleep(5);
  const pages = JSON.parse(cdt(['list_pages', '--output-format=json']));
  const list = pages?.pages || pages;
  const hit = list.find((p) => p.url.includes('compose/articles'));
  return (hit || list[list.length - 1]).id;
}

function getPageHref(pageId) {
  try {
    const pages = JSON.parse(cdt(['list_pages', '--output-format=json']));
    const url = pageUrlFromList(pages, pageId);
    if (url) return url;
  } catch {
    /* fall through */
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
  sleep(1);
  requireArticleComposer(pageId);

  clearEditor(pageId);
  sleep(0.5);

  for (let i = 0; i < paragraphs.length; i++) {
  const para = paragraphs[i];

  if (HEADINGS.has(para)) {
    emitHeading(pageId, para);
    continue;
  }

  if (para.startsWith('ERROR: column')) {
    emitQuote(pageId, para);
    continue;
  }

  if (para.startsWith('Try it in 30 seconds')) {
    emitBody(pageId, 'Try it in 30 seconds without signing up: erdonline.com/demo');
    addLink(pageId, 'erdonline.com/demo', 'https://www.erdonline.com/demo?utm_source=x&utm_campaign=mcp-agent&utm_content=dont-give-agent-prod-db');
    enter(pageId);
    continue;
  }

  if (para.startsWith('Open source (MIT')) {
    emitBody(pageId, 'Open source (MIT — star / issue / PR welcome): github.com/erd-online/erd-online');
    addLink(pageId, 'github.com/erd-online/erd-online', 'https://github.com/erd-online/erd-online?utm_source=x&utm_campaign=mcp-agent&utm_content=dont-give-agent-prod-db');
    enter(pageId);
    continue;
  }

  if (para.includes('Read ER diagrams from Cursor via MCP')) {
    emitBody(pageId, para, { bold: ['ERD Online'] });
    addLink(pageId, 'erdonline.com', 'https://www.erdonline.com/docs/guide/api-and-mcp?utm_source=x&utm_campaign=mcp-agent&utm_content=dont-give-agent-prod-db');
    enter(pageId);
    continue;
  }

  const bold = [];
  if (para.includes('invented column')) bold.push('invented column');
  if (para.includes('ERD Online')) bold.push('ERD Online');
  if (para.includes('projectJSON')) bold.push('projectJSON');
  if (para.includes('approved version')) bold.push('approved version');

  emitBody(pageId, para, { bold });
  if ((i + 1) % 5 === 0) console.log(`  ${i + 1}/${paragraphs.length}`);
}

sleep(6);
const fill = evaluate(pageId, `() => {
  const b = document.querySelector('[contenteditable="true"]');
  const text = b?.innerText || '';
  const blocks = [...b?.querySelectorAll('[data-block=true]') || []];
  return {
    href: location.href,
    bodyLen: text.length,
    words: (document.body.innerText.match(/\\d+ words/) || [])[0],
    h1: blocks.filter(x => x.tagName === 'H1').length,
    blockquote: blocks.filter(x => x.tagName === 'BLOCKQUOTE').length,
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
      hasInventedColumn: text.toLowerCase().includes('invented column'),
      hasGithub: text.includes('github.com/erd-online') || text.includes('github.com/erdonline'),
      hasDemo: text.includes('erdonline.com/demo'),
      spacingOk: (text.match(/\\n{3,}/g) || []).length <= 2 && text.length > 2500,
    };
  }`);
  console.log('preview:', JSON.stringify(preview, null, 2));
  previewOk =
    preview.isPreview &&
    preview.spacingOk &&
    preview.hasInventedColumn &&
    preview.hasGithub &&
    preview.articleLen > 2500;
  if (preview.isPreview) {
    evaluate(pageId, `() => { history.back(); return { href: location.href }; }`);
    sleep(3);
  }
  if (doSubmit && !previewOk) {
    console.error('Preview failed — not submitting');
    process.exit(1);
  }
}

let publicUrl = null;
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
  const after = evaluate(pageId, `() => ({
    href: location.href,
    hasArticle: location.href.includes('/article/'),
    bodyLen: (document.querySelector('article') || document.body)?.innerText?.length || 0,
  })`);
  console.log('after publish:', JSON.stringify(after, null, 2));
  if (after.hasArticle) publicUrl = after.href;
}

if (publicUrl) {
  cdt(['new_page', publicUrl, '--timeout=45000']);
  sleep(5);
  const pages = JSON.parse(cdt(['list_pages', '--output-format=json']));
  const list = pages?.pages || pages;
  const pub = list.find((p) => p.url.includes('/article/') && p.url.includes(publicUrl.split('/article/')[1]?.split(/[?#]/)[0]));
  const verify = evaluate(pub?.id || pageId, `() => {
    const text = (document.querySelector('article') || document.body)?.innerText || '';
    return {
      href: location.href,
      articleLen: text.length,
      hasInventedColumn: text.toLowerCase().includes('invented column'),
      hasGithub: text.includes('github.com/erd-online') || text.includes('github.com/erdonline'),
      hasDemo: text.includes('erdonline.com/demo'),
      nonEmpty: text.length > 2500,
    };
  }`);
  console.log('public:', JSON.stringify(verify, null, 2));
  if (!verify.nonEmpty) {
    console.error('Public page body empty or too short — fail');
    process.exit(1);
  }
}

console.log('shortcuts_used:', [...applied].sort().join('; '));
console.log('preview_ok:', doPreview || doSubmit ? previewOk : 'skipped');
if (publicUrl) console.log('permalink:', publicUrl);
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
