#!/usr/bin/env node
/**
 * Fill X Premium Article via official keyboard shortcuts (primary) + in-text markers.
 * ONLY legal typer for X long-form. Must click button[aria-label="create"] before typing.
 *
 * Usage:
 *   node scripts/fill-x-article-shortcuts.mjs [--slug=dont-give-agent-prod-db] [--pageId=N] [--preview] [--submit]
 */
import {
  cdt,
  evaluate,
  press,
  requireArticleEditEditor,
  sleep,
  typeText,
} from './growth/lib/x-article-cdp-guarded.mjs';
import { openArticleEditor, openArticlesPage } from './growth/lib/x-article-open-editor.mjs';
import { readParagraphs, resolvePack } from './growth/lib/x-article-packs.mjs';

const slugArg = process.argv.find((a) => a.startsWith('--slug='))?.slice(7) || 'dont-give-agent-prod-db';
const pack = resolvePack(slugArg);
const X_TITLE = pack.title;

const HEADINGS = pack.headings ?? new Set();
const SUBHEADINGS = pack.subheadings ?? new Set();
const FOOTGUNS = pack.footguns ?? [];
const NOT_DO = pack.notDo ?? [];
const CHECKLIST = pack.checklist ?? [];

const applied = new Set();

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
  evaluate(
    pageId,
    `(title) => {
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
  }`,
    [X_TITLE],
    { typing: true },
  );
}

function readBodyParagraphs() {
  return readParagraphs(pack);
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
  return openArticlesPage();
}

function emitJob1Blocks(pageId, paragraphs) {
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    if (HEADINGS.has(para)) {
      emitHeading(pageId, para, 1);
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
}

function emitSeoEssayBlocks(pageId, paragraphs) {
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
}

function previewChecks(text, preview) {
  const cfg = pack.preview;
  const triple = preview.tripleBlocks ?? 0;
  if (!preview.isPreview) return false;
  if (triple > cfg.spacingMaxTriple) return false;
  if ((preview.articleLen ?? 0) < cfg.minLen) return false;
  return Object.values(cfg.checks).every((fn) => fn(text));
}

const pageIdArg = process.argv.find((a) => a.startsWith('--pageId='))?.slice(9);
const doPreview = process.argv.includes('--preview');
const doSubmit = process.argv.includes('--submit');

try {
  cdt(['status']);
  const pageId = pageIdArg ? Number(pageIdArg) : openPage();
  if (pageIdArg) openArticleEditor(pageId);
  const paragraphs = readBodyParagraphs();

  console.log(`slug=${slugArg} pageId=${pageId} paragraphs=${paragraphs.length}`);
  requireArticleEditEditor(pageId);
  clearEditor(pageId);
  sleep(0.5);

  if (slugArg === 'dont-give-agent-prod-db') {
    emitJob1Blocks(pageId, paragraphs);
  } else {
    emitSeoEssayBlocks(pageId, paragraphs);
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
        articleText: text,
        tripleBlocks: (text.match(/\\n{3,}/g) || []).length,
      };
    }`);
    console.log('preview:', JSON.stringify(preview, null, 2));
    previewOk = previewChecks(preview.articleText, preview);
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
    const after = evaluate(pageId, `() => ({
      href: location.href,
      hasArticle: location.href.includes('/article/'),
      bodyLen: (document.querySelector('article') || document.body)?.innerText?.length || 0,
    })`);
    console.log('after publish:', JSON.stringify(after, null, 2));
    if (after.hasArticle) console.log('permalink:', after.href);
  }

  console.log('shortcuts_used:', [...applied].sort().join('; '));
  console.log('preview_ok:', doPreview || doSubmit ? previewOk : 'skipped');
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
