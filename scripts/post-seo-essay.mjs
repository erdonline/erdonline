#!/usr/bin/env node
/**
 * Publish SEO essay or content/dist package via chrome-devtools CLI.
 * Usage: node scripts/post-seo-essay.mjs <platform> [--submit] [--slug=<slug>]
 * Platforms: hashnode | medium-import | devto | juejin | csdn | oschina | zhihu
 * X Article (B-class WYSIWYG): use scripts/fill-x-article-shortcuts.mjs — never via this script
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const NODE22 = path.join(os.homedir(), '.nvm/versions/node/v22.22.0/bin');

const EN_FILE = path.join(ROOT, 'docs/growth-content/2026-08-29-seo-essay.en.md');
const ZH_FILE = path.join(ROOT, 'docs/growth-content/2026-08-29-seo-essay.zh.md');

const EN_TITLE = 'Average position 1. Zero clicks. Eight URLs, one identity.';
const ZH_TITLE = '平均排名 1，点击 0：纯前端站点的 SEO 病根不在内容，在 _redirects';
function cdt(args, { json = false } = {}) {
  const cmdArgs = ['-y', '--package=chrome-devtools-mcp', 'chrome-devtools', ...args];
  if (json) cmdArgs.push('--output-format=json');
  const r = spawnSync('npx', cmdArgs, {
    env: { ...process.env, PATH: `${NODE22}:${process.env.PATH}` },
    encoding: 'utf-8',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || '').trim());
  return (r.stdout || '').trim();
}

function parseEval(raw) {
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
    return raw;
  }
}

function evaluate(pageId, fn, args = []) {
  const cliArgs = ['evaluate_script', fn, `--pageId=${pageId}`];
  if (args.length) cliArgs.push(`--args=${JSON.stringify(args)}`);
  return parseEval(cdt(cliArgs, { json: true }));
}

function listPages() {
  return JSON.parse(cdt(['list_pages'], { json: true }));
}

function selectedPageId() {
  const pages = listPages();
  const list = pages?.pages || pages;
  const sel = list.find((p) => p.selected) || list[list.length - 1];
  return sel.id;
}

function openUrl(url) {
  cdt(['new_page', url, '--timeout=45000']);
  spawnSync('sleep', ['3']);
  return selectedPageId();
}

function click(pageId, uid) {
  return cdt(['click', uid, `--pageId=${pageId}`]);
}

function snapshot(pageId) {
  return cdt(['take_snapshot', String(pageId)]);
}

function stripFrontmatter(text) {
  if (text.startsWith('---')) {
    const end = text.indexOf('---\n', 3);
    if (end !== -1) text = text.slice(end + 4);
  }
  return text.trimEnd();
}

function stripMdTitle(text) {
  return text.replace(/^# .+\n+/, '').trimEnd();
}

function parseFrontmatter(file) {
  const raw = fs.readFileSync(file, 'utf-8');
  if (!raw.startsWith('---')) return {};
  const end = raw.indexOf('---\n', 3);
  if (end === -1) return {};
  const fm = {};
  for (const line of raw.slice(3, end).split('\n')) {
    const m = line.match(/^(\w+):\s*(.+)$/);
    if (m) fm[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return fm;
}

const slugArg = process.argv.find((a) => a.startsWith('--slug='))?.slice(7) || null;

function loadSlugPackage(platform) {
  const articleFile = path.join(ROOT, 'content/articles', `${slugArg}.md`);
  const bodyFile = path.join(ROOT, 'content/dist', slugArg, `${platform}.md`);
  if (!fs.existsSync(articleFile)) throw new Error(`Article not found: ${articleFile}`);
  if (!fs.existsSync(bodyFile)) throw new Error(`Dist body not found: ${bodyFile}`);
  const fm = parseFrontmatter(articleFile);
  const title = fm.title || slugArg;
  const body = stripMdTitle(fs.readFileSync(bodyFile, 'utf-8'));
  return { title, body };
}

function slugEnFile() {
  return path.join(ROOT, 'content/articles', `${slugArg}.en.md`);
}

function getEnContent() {
  if (slugArg) {
    const enFile = slugEnFile();
    if (!fs.existsSync(enFile)) {
      throw new Error(`EN article not found: ${enFile} — write EN before publishing international platforms`);
    }
    const fm = parseFrontmatter(enFile);
    const title = fm.title || slugArg;
    const body = stripFrontmatter(fs.readFileSync(enFile, 'utf-8'));
    return { title, body };
  }
  return { title: EN_TITLE, body: readEnBody() };
}

function getZhContent(platform) {
  if (slugArg) return loadSlugPackage(platform);
  return { title: ZH_TITLE, body: readZhBody() };
}

function juejinTags() {
  if (slugArg === 'dont-give-agent-prod-db') return { category: '后端', tags: ['数据库', 'MCP', 'AI', '开源'] };
  return { category: '前端', tags: ['SEO', '前端', 'Cloudflare', '开源'] };
}

function csdnTags() {
  if (slugArg === 'dont-give-agent-prod-db') return ['数据库', '开源', '架构', 'MCP'];
  return ['SEO', '前端', 'Cloudflare', '开源', '数据库'];
}

function readEnBody() {
  return stripFrontmatter(fs.readFileSync(EN_FILE, 'utf-8'));
}

function readZhBody() {
  return stripFrontmatter(fs.readFileSync(ZH_FILE, 'utf-8'));
}

function esc(s) {
  return JSON.stringify(s);
}

function b64(s) {
  return Buffer.from(s, 'utf-8').toString('base64');
}

const DECODE_UTF8_B64 = `
const decodeUtf8B64 = (b64) => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
};
`;

function sleepJitter(minSec = 1, maxSec = 3) {
  const sec = minSec + Math.random() * (maxSec - minSec);
  spawnSync('sleep', [String(Math.ceil(sec))]);
}

/** OSChina happy path: swap→确定切换→visible textarea native setter. Never pre.textContent. */
function ensureOschinaMarkdown(pageId) {
  const detect = evaluate(
    pageId,
    `() => {
      const hasTiptap = !!document.querySelector('.tiptap');
      const ta = [...document.querySelectorAll('textarea')].find(
        (t) => t.offsetWidth > 100 && !(t.placeholder || '').includes('标题'),
      );
      if (ta && !hasTiptap) return { mode: 'md', switched: false, hasTextarea: true };
      return { mode: 'wysiwyg', switched: false, hasTiptap, hasTextarea: !!ta };
    }`,
  );
  if (detect.mode === 'md') return detect;

  evaluate(
    pageId,
    `() => {
      const swap =
        document.querySelector('img[alt="swap"]')?.closest('div,span,button,a')
        || document.querySelector('img[alt="swap"]');
      swap?.click();
      return { clickedSwap: !!swap };
    }`,
  );
  sleepJitter(1, 3);

  const confirm = evaluate(
    pageId,
    `() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.innerText?.includes('确定切换'));
      btn?.click();
      return { confirmed: !!btn };
    }`,
  );
  if (!confirm.confirmed) throw new Error('OSChina: 确定切换 not found — HARD STOP');
  sleepJitter(1, 3);

  return evaluate(
    pageId,
    `() => {
      const hasTiptap = !!document.querySelector('.tiptap');
      const ta = [...document.querySelectorAll('textarea')].find(
        (t) => t.offsetWidth > 100 && !(t.placeholder || '').includes('标题'),
      );
      return { mode: ta && !hasTiptap ? 'md' : 'unknown', hasTextarea: !!ta, hasTiptap };
    }`,
  );
}

function fillOschinaEditor(pageId, title, body) {
  return evaluate(
    pageId,
    `() => {
      ${SET_NATIVE}
      const title = ${esc(title)};
      const body = ${esc(body)};
      const titleEl = document.querySelector('input[placeholder*="标题"], textarea[placeholder*="标题"]');
      const ta =
        [...document.querySelectorAll('textarea')].find(
          (t) => t.offsetWidth > 100 && !(t.placeholder || '').includes('标题'),
        ) || null;
      if (titleEl) setNative(titleEl, title);
      if (ta) setNative(ta, body);
      const val = ta?.value || '';
      const half = Math.floor(val.length / 2);
      return {
        titleLen: titleEl?.value?.length ?? 0,
        textareaLen: val.length,
        newlineCount: (val.match(/\\n/g) || []).length,
        possibleDuplicate: val.length > 100 && val.slice(0, half) === val.slice(half),
        isChinese: /[\\u4e00-\\u9fff]/.test(val),
        hasTextarea: !!ta,
        href: location.href,
      };
    }`,
  );
}

function verifyOschinaPublic(url) {
  const pub = verifyPublic(url);
  const ok = pub.articleLen >= 1000 && pub.chinese >= 100;
  return { ...pub, ok };
}

const SET_NATIVE = `
const setNative = (el, value) => {
  if (!el) return false;
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, 'value');
  desc?.set?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
};
`;

function readback(title, bodyEl) {
  return `{ titleLen: ${title}?.value?.length ?? 0, bodyLen: ${bodyEl}?.value?.length ?? ${bodyEl}?.innerText?.length ?? 0, newlineCount: ((${bodyEl}?.value || ${bodyEl}?.innerText || '').match(/\\n/g) || []).length, possibleDuplicate: (() => { const v = ${bodyEl}?.value || ${bodyEl}?.innerText || ''; const h = Math.floor(v.length/2); return v.length > 100 && v.slice(0,h) === v.slice(h); })(), preview: (${bodyEl}?.value || ${bodyEl}?.innerText || '').slice(0,100), href: location.href }`;
}

function verifyPublic(url, checks = {}) {
  const pid = openUrl(url);
  return evaluate(
    pid,
    `(checks) => {
      const text = document.body?.innerText || '';
      const article = document.querySelector('article, main, .blog-content, .Post-RichText, .article-content, .detail-body')?.innerText || text;
      return {
        href: location.href,
        title: document.querySelector('h1')?.innerText || document.title,
        articleLen: article.length,
        bodyLen: text.length,
        chinese: (article.match(/[\\u4e00-\\u9fff]/g) || []).length,
        hasRedirects: /redirects|_redirects|soft 404|soft-404|one identity|一个身份/i.test(article),
        hasSeoHealth: /seo-index-health|seo_health|__seo_health/i.test(article),
        hasMcp: /MCP|mcp/.test(article),
        preview: article.slice(0, 200),
        ...checks
      };
    }`,
    [checks],
  );
}

async function hashnode(submit) {
  const { title: enTitle, body } = getEnContent();
  const pid = openUrl('https://hashnode.com/new');
  // Check login
  const loginCheck = evaluate(pid, `() => ({ href: location.href, hasSignIn: !!document.body?.innerText?.includes('Sign in') })`);
  if (loginCheck.hasSignIn) throw new Error('Hashnode not logged in — HARD STOP');

  // Click Markdown tab
  evaluate(pid, `() => {
    const tab = [...document.querySelectorAll('[role="tab"], button, a')].find(el => /^Markdown$/i.test(el.innerText?.trim()));
    tab?.click();
    return { clickedMd: !!tab };
  }`);
  spawnSync('sleep', ['1']);

  const fill = evaluate(
    pid,
    `() => {
      ${SET_NATIVE}
      ${DECODE_UTF8_B64}
      const title = decodeUtf8B64(${esc(b64(enTitle))});
      const body = decodeUtf8B64(${esc(b64(body))});
      const titleEl = document.querySelector('textarea[placeholder*="Article Title" i], textarea[placeholder*="title" i]');
      const bodyEl = document.querySelector('textarea[placeholder*="markdown" i], textarea[placeholder*="Write" i]') 
        || [...document.querySelectorAll('textarea')].find(t => t !== titleEl && t.offsetHeight > 100);
      setNative(titleEl, title);
      setNative(bodyEl, body);
      ${readback('titleEl', 'bodyEl')}
    }`,
  );
  console.log('hashnode fill:', JSON.stringify(fill, null, 2));
  if (!submit) return { fill, pid };

  // Publish flow
  evaluate(pid, `() => {
    const btn = [...document.querySelectorAll('button')].find(b => /^Publish$/i.test(b.innerText?.trim()));
    btn?.click();
    return { clickedPublish: !!btn };
  }`);
  spawnSync('sleep', ['2']);
  evaluate(pid, `() => {
    const pub = [...document.querySelectorAll('button, [role="option"], li, div')].find(el => /ERD Online|erdonline/i.test(el.innerText));
    pub?.click();
    return { selectedPub: !!pub, text: pub?.innerText?.slice(0,50) };
  }`);
  spawnSync('sleep', ['1']);
  evaluate(pid, `() => {
    const btn = [...document.querySelectorAll('button')].find(b => /^Publish$/i.test(b.innerText?.trim()) && b.offsetParent);
    btn?.click();
    return { clickedFinalPublish: !!btn, href: location.href };
  }`);
  spawnSync('sleep', ['5']);
  const href = evaluate(pid, `() => ({ href: location.href, title: document.title })`);
  console.log('hashnode published:', href);
  const publicUrl = href.href?.includes('hashnode.dev/') ? href.href.split('?')[0] : null;
  let pub = null;
  if (publicUrl) {
    pub = verifyPublic(publicUrl);
    pub.ok = pub.articleLen >= 500 && !pub.hasSeoHealth;
    console.log('hashnode public:', JSON.stringify(pub, null, 2));
    if (!pub.ok) throw new Error(`Hashnode public verify FAILED: articleLen=${pub.articleLen}`);
  }
  return { fill, href, pub };
}

async function mediumImport(hashnodeUrl, submit) {
  const pid = openUrl('https://medium.com/p/import');
  const loginCheck = evaluate(pid, `() => ({ href: location.href, isSignIn: location.href.includes('signin') })`);
  if (loginCheck.isSignIn) throw new Error('Medium not logged in — HARD STOP');

  evaluate(
    pid,
    `() => {
      const url = ${esc(hashnodeUrl)};
      const el = document.querySelector('[contenteditable="true"], textarea, input[type="url"], input');
      if (el?.getAttribute('contenteditable') === 'true') {
        el.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, url);
      } else if (el) {
        const proto = HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, url);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return { filled: !!el, href: location.href };
    }`,
  );
  evaluate(pid, `() => {
    const btn = [...document.querySelectorAll('button')].find(b => /Import/i.test(b.innerText));
    btn?.click();
    return { clickedImport: !!btn };
  }`);
  spawnSync('sleep', ['15']);
  const state = evaluate(pid, `() => ({
    href: location.href,
    saveError: !!document.body?.innerText?.includes('Something is wrong'),
    saved: document.body?.innerText?.includes('Saved') || document.querySelector('[data-testid="editorPublishButton"]'),
    bodyLen: document.querySelector('main')?.innerText?.length ?? 0
  })`);
  console.log('medium import state:', state);
  if (state.saveError) throw new Error('Medium save error — HARD STOP');
  if (!submit) return { state, pid };

  evaluate(pid, `() => {
    const btn = document.querySelector('[data-testid="editorPublishButton"]') || [...document.querySelectorAll('button')].find(b => /^Publish$/i.test(b.innerText?.trim()));
    btn?.click();
    return { clickedPublish: !!btn };
  }`);
  spawnSync('sleep', ['3']);
  evaluate(pid, `() => {
    const btn = [...document.querySelectorAll('button')].find(b => /^Publish$/i.test(b.innerText?.trim()) && !b.disabled);
    btn?.click();
    return { clickedSubmissionPublish: !!btn, href: location.href };
  }`);
  spawnSync('sleep', ['5']);
  const href = evaluate(pid, `() => ({ href: location.href })`);
  console.log('medium published:', href);
  return { state, href };
}

async function devto(submit) {
  const { title: enTitle, body } = getEnContent();
  const pid = openUrl('https://dev.to/new');
  evaluate(pid, `() => {
    const skip = [...document.querySelectorAll('a, button')].find(el => /Skip for now/i.test(el.innerText));
    skip?.click();
    return { skipped: !!skip };
  }`);
  spawnSync('sleep', ['2']);
  const fill = evaluate(
    pid,
    `() => {
      ${SET_NATIVE}
      ${DECODE_UTF8_B64}
      const title = decodeUtf8B64(${esc(b64(enTitle))});
      const body = decodeUtf8B64(${esc(b64(body))});
      const titleEl = document.querySelector('#article-form-title, input[name="article[title]"], textarea[placeholder*="Title" i]');
      const bodyEl = document.querySelector('#article_body_markdown, textarea[name="article[body_markdown]"]');
      setNative(titleEl, title);
      setNative(bodyEl, body);
      ${readback('titleEl', 'bodyEl')}
    }`,
  );
  console.log('devto fill:', JSON.stringify(fill, null, 2));
  if (!submit) return { fill, pid };

  evaluate(pid, `() => {
    const btn = [...document.querySelectorAll('button')].find(b => /^Publish$/i.test(b.innerText?.trim()));
    btn?.click();
    return { clicked: !!btn };
  }`);
  spawnSync('sleep', ['5']);
  const href = evaluate(pid, `() => ({ href: location.href })`);
  const publicUrl = href.href?.includes('dev.to/') && !href.href.includes('/new') ? href.href.split('?')[0] : null;
  let pub = null;
  if (publicUrl) {
    pub = verifyPublic(publicUrl);
    pub.ok = pub.articleLen >= 500 && !pub.hasSeoHealth;
    console.log('devto public:', JSON.stringify(pub, null, 2));
    if (!pub.ok) throw new Error(`Dev.to public verify FAILED: articleLen=${pub.articleLen}`);
  }
  return { fill, href, pub };
}

/** X Article is B-class WYSIWYG — block IR + official shortcuts + Preview; never full-body paste. */
function xLongformBlocked() {
  throw new Error(
    [
      'X Article is B-class WYSIWYG: use scripts/fill-x-article-shortcuts.mjs + x-article-playbook.md; never insertText full markdown.',
      '',
      '正文不是一下全部复制进去的 — 按 block 打字 + 官方快捷键 (# / ## / Body)，Preview 强制后再 Publish。',
      '',
      'Playbook: docs/growth-templates/x-article-playbook.md',
      '  1. Open https://x.com/compose/articles',
      '  2. node scripts/fill-x-article-shortcuts.mjs [--pageId=N] [--preview] [--submit]',
    ].join('\n'),
  );
}

/** Locked in live inspect 2026-08-29 — ByteMD CM5 first, CM6 fallback only under .bytemd */
const JUEJIN_BODY_SELECTORS = [
  '.bytemd .CodeMirror textarea',
  '.bytemd .cm-content[contenteditable="true"]',
];

const PICK_JUEJIN_BODY_EL = `
function pickJuejinBodyEl() {
  const selectors = ${JSON.stringify(JUEJIN_BODY_SELECTORS)};
  for (const bodySelector of selectors) {
    const el = document.querySelector(bodySelector);
    if (el) return { el, bodySelector };
  }
  return { el: null, bodySelector: null };
}

function fillJuejinBody(bodyEl, body) {
  const cm = bodyEl?.closest?.('.CodeMirror')?.CodeMirror;
  if (cm) {
    cm.setValue(body);
    return cm.getValue();
  }
  if (bodyEl instanceof HTMLTextAreaElement) {
    setNative(bodyEl, body);
    return bodyEl.value;
  }
  bodyEl.textContent = body;
  bodyEl.dispatchEvent(new Event('input', { bubbles: true }));
  return bodyEl.textContent ?? bodyEl.innerText ?? '';
}
`;

async function juejin(submit) {
  const { title: zhTitle, body } = getZhContent('juejin');
  const minBodyLen = Math.max(500, Math.floor(body.length * 0.5));
  const minNewlines = Math.max(10, Math.floor((body.match(/\n/g) || []).length * 0.5));
  const pid = openUrl('https://juejin.cn/editor/drafts/new');
  spawnSync('sleep', ['3']);
  const fill = evaluate(
    pid,
    `() => {
      ${SET_NATIVE}
      ${PICK_JUEJIN_BODY_EL}
      const title = ${esc(zhTitle)};
      const body = ${esc(body)};
      const titleEl = document.querySelector('input[placeholder*="标题"], textarea[placeholder*="标题"]');
      const { el: bodyEl, bodySelector } = pickJuejinBodyEl();
      if (titleEl) setNative(titleEl, title);
      if (!bodyEl) {
        return {
          bodySelector: null,
          titleLen: titleEl?.value?.length ?? 0,
          bodyLen: 0,
          newlineCount: 0,
          isChinese: false,
          href: location.href,
          error: 'Juejin body element not found — check ByteMD mount or login wall',
        };
      }
      const val = fillJuejinBody(bodyEl, body);
      return {
        bodySelector,
        titleLen: titleEl?.value?.length ?? 0,
        bodyLen: val.length,
        newlineCount: (val.match(/\\n/g) || []).length,
        isChinese: /[\\u4e00-\\u9fff]/.test(val),
        href: location.href,
      };
    }`,
  );
  console.log('juejin fill:', JSON.stringify(fill, null, 2));
  if (fill.error || !fill.bodySelector) {
    throw new Error(fill.error || 'Juejin: locked body selector missed — HARD STOP');
  }
  if (submit && (fill.bodyLen < minBodyLen || fill.newlineCount < minNewlines)) {
    throw new Error(
      `Juejin: body read-back too short (bodyLen=${fill.bodyLen} < ${minBodyLen}, newlineCount=${fill.newlineCount} < ${minNewlines}) — abort submit`,
    );
  }
  if (!submit) return { fill, pid };

  evaluate(pid, `() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText?.trim() === '发布');
    btn?.click();
    return { clickedPublish: !!btn };
  }`);
  spawnSync('sleep', ['2']);
  const { category, tags } = juejinTags();
  evaluate(pid, `() => {
    const cat = [...document.querySelectorAll('label, span, div, li')].find(el => el.innerText?.trim() === ${esc(category)});
    cat?.click();
    for (const tag of ${JSON.stringify(tags)}) {
      const t = [...document.querySelectorAll('label, span, div, li, button')].find(el => el.innerText?.trim() === tag);
      t?.click();
    }
    return { href: location.href };
  }`);
  spawnSync('sleep', ['1']);
  evaluate(pid, `() => {
    const btn = [...document.querySelectorAll('button')].find(b => /确定并发布|发布/.test(b.innerText));
    btn?.click();
    return { clickedConfirm: !!btn, text: btn?.innerText };
  }`);
  spawnSync('sleep', ['5']);
  const href = evaluate(pid, `() => ({ href: location.href })`);
  const publicUrl = href.href?.includes('/post/') ? href.href.split('?')[0] : null;
  let pub = null;
  if (publicUrl) {
    pub = verifyPublic(publicUrl);
    pub.ok = pub.articleLen >= 500 && pub.chinese >= 100;
    console.log('juejin public:', JSON.stringify(pub, null, 2));
    if (!pub.ok) throw new Error(`Juejin public verify FAILED: articleLen=${pub.articleLen}`);
  }
  return { fill, href, pub };
}

async function csdn(submit) {
  const { title: zhTitle, body } = getZhContent('csdn');
  const pid = openUrl('https://editor.csdn.net/md');
  spawnSync('sleep', ['3']);
  const fill = evaluate(
    pid,
    `() => {
      ${SET_NATIVE}
      const title = ${esc(zhTitle)};
      const body = ${esc(body)};
      const titleEl = document.querySelector('input.article-bar__title, input[placeholder*="标题"]');
      if (titleEl) setNative(titleEl, title);
      const pre = document.querySelector('pre.editor__inner');
      if (pre) {
        pre.textContent = body;
        pre.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const val = pre?.textContent || '';
      return { titleLen: titleEl?.value?.length ?? 0, bodyLen: val.length, newlineCount: (val.match(/\\n/g)||[]).length, isChinese: /[\\u4e00-\\u9fff]/.test(val), href: location.href };
    }`,
  );
  console.log('csdn fill:', JSON.stringify(fill, null, 2));
  if (!submit) return { fill, pid };

  evaluate(pid, `() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText?.includes('发布文章'));
    btn?.click();
    return { clicked: !!btn };
  }`);
  spawnSync('sleep', ['2']);
  for (const tag of csdnTags()) {
    evaluate(pid, `() => {
      const t = [...document.querySelectorAll('span, label, li')].find(el => el.innerText?.trim() === ${esc(tag)});
      t?.click();
      return { tag: ${esc(tag)} };
    }`);
  }
  spawnSync('sleep', ['1']);
  evaluate(pid, `() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText?.includes('发布文章') && b.offsetParent);
    btn?.click();
    return { clickedConfirm: !!btn, href: location.href };
  }`);
  spawnSync('sleep', ['5']);
  const href = evaluate(pid, `() => ({ href: location.href })`);
  const publicUrl = href.href?.includes('/details/') ? href.href.split('?')[0] : null;
  let pub = null;
  if (publicUrl) {
    pub = verifyPublic(publicUrl);
    pub.ok = pub.articleLen >= 500 && pub.chinese >= 100;
    console.log('csdn public:', JSON.stringify(pub, null, 2));
    if (!pub.ok) throw new Error(`CSDN public verify FAILED: articleLen=${pub.articleLen}`);
  }
  return { fill, href, pub };
}

async function oschina(submit) {
  const { title: zhTitle, body } = getZhContent('oschina');
  const minFillLen = Math.max(1000, Math.floor(body.length * 0.5));
  const pid = openUrl('https://my.oschina.net/u/3339242/blog/ai-write');
  sleepJitter(1, 3);

  const mode = ensureOschinaMarkdown(pid);
  console.log('oschina mode:', JSON.stringify(mode, null, 2));
  if (mode.mode !== 'md' || !mode.hasTextarea) {
    throw new Error(`OSChina: Markdown textarea not ready (mode=${mode.mode}) — HARD STOP`);
  }
  sleepJitter(1, 3);

  const fill = fillOschinaEditor(pid, zhTitle, body);
  console.log('oschina fill:', JSON.stringify(fill, null, 2));
  if (!fill.hasTextarea) throw new Error('OSChina: visible body textarea not found — HARD STOP');
  if (fill.textareaLen < minFillLen) {
    throw new Error(
      `OSChina: textarea read-back too short (${fill.textareaLen} < ${minFillLen}) — abort submit`,
    );
  }
  if (!fill.isChinese) throw new Error('OSChina: textarea read-back has no Chinese — abort submit');
  if (!submit) return { fill, pid, mode };

  evaluate(pid, `() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /发布文章/.test(b.innerText));
    btn?.click();
    return { clicked: !!btn };
  }`);
  sleepJitter(1, 3);
  evaluate(pid, `() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /确定并发布|确定/.test(b.innerText));
    btn?.click();
    return { confirmed: !!btn, href: location.href };
  }`);
  sleepJitter(2, 3);
  const href = evaluate(pid, `() => ({ href: location.href })`);
  const publicUrl = href.href?.includes('/blog/') && !href.href.includes('ai-write') ? href.href : null;
  if (!publicUrl) throw new Error(`OSChina: no public URL after publish (${href.href}) — HARD STOP`);

  const pub = verifyOschinaPublic(publicUrl);
  console.log('oschina public:', JSON.stringify(pub, null, 2));
  if (!pub.ok) {
    throw new Error(
      `OSChina public verify FAILED: articleLen=${pub.articleLen} chinese=${pub.chinese} — editor read-back ≠ success`,
    );
  }
  return { fill, href, pub };
}

function mdToZhihuHtml(md) {
  const escHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let html = '';
  let inCode = false;
  for (const line of md.split('\n')) {
    if (line.startsWith('```')) {
      if (!inCode) {
        html += '<pre><code>';
        inCode = true;
      } else {
        html += '</code></pre>';
        inCode = false;
      }
      continue;
    }
    if (inCode) {
      html += `${escHtml(line)}\n`;
      continue;
    }
    if (line.startsWith('## ')) {
      html += `<h2>${escHtml(line.slice(3))}</h2>`;
      continue;
    }
    if (line.startsWith('> ')) {
      html += `<blockquote><p>${escHtml(line.slice(2))}</p></blockquote>`;
      continue;
    }
    if (line.trim() === '') continue;
    let t = escHtml(line);
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
    html += `<p>${t}</p>`;
  }
  return html;
}

async function zhihuPatchDraft(pageId, articleId, body) {
  const html = mdToZhihuHtml(body);
  return evaluate(
    pageId,
    `async (articleId, html) => {
      const xsrf = document.cookie.match(/_xsrf=([^;]+)/)?.[1];
      const res = await fetch('/api/articles/' + articleId + '/draft', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', 'x-xsrftoken': xsrf },
        credentials: 'include',
        body: JSON.stringify({ content: html, table_of_contents: false, can_reward: false, delta_time: 30 }),
      });
      return { status: res.status, htmlLen: html.length, chinese: (html.match(/[\\u4e00-\\u9fff]/g) || []).length, ok: res.ok };
    }`,
    [articleId, html],
  );
}

async function zhihu(submit) {
  const { title: zhTitle, body } = getZhContent('zhihu');
  const pid = openUrl('https://zhuanlan.zhihu.com/write');
  spawnSync('sleep', ['3']);
  const fill = evaluate(
    pid,
    `() => {
      ${SET_NATIVE}
      const title = ${esc(zhTitle)};
      const body = ${esc(body)};
      const titleEl = document.querySelector('textarea[placeholder*="标题"], input[placeholder*="标题"]');
      if (titleEl) setNative(titleEl, title);
      const ce = document.querySelector('[contenteditable="true"].public-DraftEditor-content, [contenteditable="true"]');
      if (ce) {
        ce.focus();
        const dt = new DataTransfer();
        dt.setData('text/plain', body);
        ce.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt }));
      }
      for (const ta of document.querySelectorAll('textarea')) {
        if (ta !== titleEl) setNative(ta, body);
      }
      const bestTa = [...document.querySelectorAll('textarea')].filter(t => t !== titleEl).sort((a,b) => b.value.length - a.value.length)[0];
      return { titleLen: titleEl?.value?.length ?? 0, textareaLen: bestTa?.value?.length ?? 0, ceLen: ce?.innerText?.length ?? 0, href: location.href };
    }`,
  );
  console.log('zhihu fill:', JSON.stringify(fill, null, 2));
  if (!submit) return { fill, pid };

  // Save draft first to get article id, then PATCH body (reliable path per recipes)
  evaluate(pid, `() => {
    const btn = [...document.querySelectorAll('button')].find(b => /保存草稿|暂存|保存/.test(b.innerText) && !b.disabled);
    btn?.click();
    return { clickedSave: !!btn, href: location.href };
  }`);
  spawnSync('sleep', ['3']);
  const draftMeta = evaluate(pid, `() => {
    const m = location.href.match(/\\/p\\/(\\d+)/);
    return { href: location.href, articleId: m?.[1] || null };
  }`);
  let patch = null;
  if (draftMeta.articleId) {
    patch = await zhihuPatchDraft(pid, draftMeta.articleId, body);
    console.log('zhihu patch:', JSON.stringify(patch, null, 2));
    if (!patch.ok) throw new Error(`Zhihu PATCH draft failed: status=${patch.status}`);
    openUrl(`https://zhuanlan.zhihu.com/p/${draftMeta.articleId}/edit`);
    spawnSync('sleep', ['3']);
  }

  evaluate(pid, `() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText?.trim() === '发布' && !b.disabled);
    btn?.click();
    return { clicked: !!btn };
  }`);
  spawnSync('sleep', ['5']);
  const href = evaluate(pid, `() => ({ href: location.href })`);
  const publicUrl = /zhuanlan\.zhihu\.com\/p\/\d+/.test(href.href)
    ? href.href.split('/edit')[0].split('?')[0]
    : draftMeta.articleId
      ? `https://zhuanlan.zhihu.com/p/${draftMeta.articleId}`
      : null;
  let pub = null;
  if (publicUrl) {
    pub = verifyPublic(publicUrl);
    pub.ok = pub.articleLen >= 500 && pub.chinese >= 100;
    console.log('zhihu public:', JSON.stringify(pub, null, 2));
    if (!pub.ok) throw new Error(`Zhihu public verify FAILED: articleLen=${pub.articleLen}`);
  }
  return { fill, href, patch, pub };
}

const platform = process.argv[2];
const submit = process.argv.includes('--submit');
const hashnodeUrl = process.argv.find((a) => a.startsWith('--hashnode-url='))?.slice(15);

try {
  cdt(['status']);
  switch (platform) {
    case 'hashnode':
      console.log(JSON.stringify(await hashnode(submit), null, 2));
      break;
    case 'medium-import':
      if (!hashnodeUrl) throw new Error('--hashnode-url= required');
      console.log(JSON.stringify(await mediumImport(hashnodeUrl, submit), null, 2));
      break;
    case 'devto':
      console.log(JSON.stringify(await devto(submit), null, 2));
      break;
    case 'x':
      xLongformBlocked();
      break;
    case 'juejin':
      console.log(JSON.stringify(await juejin(submit), null, 2));
      break;
    case 'csdn':
      console.log(JSON.stringify(await csdn(submit), null, 2));
      break;
    case 'oschina':
      console.log(JSON.stringify(await oschina(submit), null, 2));
      break;
    case 'zhihu':
      console.log(JSON.stringify(await zhihu(submit), null, 2));
      break;
    case 'verify':
      console.log(JSON.stringify(verifyPublic(process.argv[3]), null, 2));
      break;
    default:
      console.error('Usage: node scripts/post-seo-essay.mjs <platform> [--submit] [--hashnode-url=...]');
      process.exit(1);
  }
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
