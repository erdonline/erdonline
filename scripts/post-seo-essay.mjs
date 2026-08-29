#!/usr/bin/env node
/**
 * Publish SEO essay (2026-08-29) via chrome-devtools CLI.
 * Usage: node scripts/post-seo-essay.mjs <platform> [--submit]
 * Platforms: hashnode | medium-import | devto | x | juejin | csdn | oschina | zhihu
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
const X_FILE = path.join(ROOT, 'docs/growth-content/2026-08-29-seo-essay-x.md');

const EN_TITLE = 'Average position 1. Zero clicks. Eight URLs, one identity.';
const ZH_TITLE = '平均排名 1，点击 0：纯前端站点的 SEO 病根不在内容，在 _redirects';
const X_TITLE = 'Average position 1. Zero clicks. Our site had eight URLs and one identity.';

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
  const m = raw.match(/```json\n([\s\S]*?)\n```/);
  try {
    return JSON.parse(m ? m[1] : raw);
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

function readEnBody() {
  return stripFrontmatter(fs.readFileSync(EN_FILE, 'utf-8'));
}

function readZhBody() {
  return stripFrontmatter(fs.readFileSync(ZH_FILE, 'utf-8'));
}

function readXBody() {
  const text = fs.readFileSync(X_FILE, 'utf-8');
  const marker = '## X body (paste as-is, below the line)';
  const idx = text.indexOf(marker);
  if (idx === -1) throw new Error('X body marker not found');
  let body = text.slice(idx + marker.length).trim();
  const tagIdx = body.indexOf('\n---\n\n## Platform tag lines');
  if (tagIdx !== -1) body = body.slice(0, tagIdx).trim();
  return body;
}

function esc(s) {
  return JSON.stringify(s);
}

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
  const body = readEnBody();
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
      const title = ${esc(EN_TITLE)};
      const body = ${esc(body)};
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
  return { fill, href };
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
  const href = evaluate(pid, `() => ({ href: location.href }))`);
  console.log('medium published:', href);
  return { state, href };
}

async function devto(submit) {
  const body = readEnBody();
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
      const title = ${esc(EN_TITLE)};
      const body = ${esc(body)};
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
  const href = evaluate(pid, `() => ({ href: location.href }))`);
  return { fill, href };
}

async function xLongform(submit) {
  const body = readXBody();
  const pid = openUrl('https://x.com/compose/articles');
  spawnSync('sleep', ['3']);
  const fill = evaluate(
    pid,
    `() => {
      const title = ${esc(X_TITLE)};
      const body = ${esc(body)};
      const titleEl = document.querySelector('textarea[placeholder*="Title" i], input[placeholder*="Title" i], [data-testid*="title"] textarea, textarea');
      const setNative = (el, value) => {
        if (!el) return false;
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      };
      if (titleEl) setNative(titleEl, title);
      const bodyEl = document.querySelector('[contenteditable="true"][role="textbox"], [data-testid="tweetTextarea_0"], [contenteditable="true"]');
      if (bodyEl) {
        bodyEl.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, body);
      }
      return {
        titleLen: titleEl?.value?.length ?? 0,
        bodyLen: bodyEl?.innerText?.length ?? 0,
        newlineCount: (bodyEl?.innerText?.match(/\\n/g) || []).length,
        href: location.href
      };
    }`,
  );
  console.log('x fill:', JSON.stringify(fill, null, 2));
  if (!submit) return { fill, pid };

  evaluate(pid, `() => {
    const btn = [...document.querySelectorAll('button, [role="button"]')].find(b => /Publish|Post|Next/i.test(b.innerText) && !b.disabled);
    btn?.click();
    return { clicked: !!btn, text: btn?.innerText };
  }`);
  spawnSync('sleep', ['5']);
  const href = evaluate(pid, `() => ({ href: location.href }))`);
  return { fill, href };
}

async function juejin(submit) {
  const body = readZhBody();
  const pid = openUrl('https://juejin.cn/editor/drafts/new');
  spawnSync('sleep', ['3']);
  const fill = evaluate(
    pid,
    `() => {
      ${SET_NATIVE}
      const title = ${esc(ZH_TITLE)};
      const body = ${esc(body)};
      const titleEl = document.querySelector('input[placeholder*="标题"], textarea[placeholder*="标题"]');
      const bodyEl = document.querySelector('.editor textarea, textarea') 
        || document.querySelector('[contenteditable="true"]');
      if (titleEl) setNative(titleEl, title);
      if (bodyEl?.tagName === 'TEXTAREA') setNative(bodyEl, body);
      else if (bodyEl) { bodyEl.focus(); document.execCommand('selectAll', false, null); document.execCommand('insertText', false, body); }
      const val = bodyEl?.value || bodyEl?.innerText || '';
      return { titleLen: titleEl?.value?.length ?? 0, bodyLen: val.length, newlineCount: (val.match(/\\n/g)||[]).length, isChinese: /[\\u4e00-\\u9fff]/.test(val), href: location.href };
    }`,
  );
  console.log('juejin fill:', JSON.stringify(fill, null, 2));
  if (!submit) return { fill, pid };

  evaluate(pid, `() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText?.trim() === '发布');
    btn?.click();
    return { clickedPublish: !!btn };
  }`);
  spawnSync('sleep', ['2']);
  // Category 前端 + tags
  evaluate(pid, `() => {
    const cat = [...document.querySelectorAll('label, span, div, li')].find(el => el.innerText?.trim() === '前端');
    cat?.click();
    for (const tag of ['SEO', '前端', 'Cloudflare', '开源']) {
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
  const href = evaluate(pid, `() => ({ href: location.href }))`);
  return { fill, href };
}

async function csdn(submit) {
  const body = readZhBody();
  const pid = openUrl('https://editor.csdn.net/md');
  spawnSync('sleep', ['3']);
  const fill = evaluate(
    pid,
    `() => {
      ${SET_NATIVE}
      const title = ${esc(ZH_TITLE)};
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
  for (const tag of ['SEO', '前端', 'Cloudflare', '开源', '数据库']) {
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
  const href = evaluate(pid, `() => ({ href: location.href }))`);
  return { fill, href };
}

async function oschina(submit) {
  const body = readZhBody();
  const minFillLen = Math.max(1000, Math.floor(body.length * 0.5));
  const pid = openUrl('https://my.oschina.net/u/3339242/blog/ai-write');
  sleepJitter(1, 3);

  const mode = ensureOschinaMarkdown(pid);
  console.log('oschina mode:', JSON.stringify(mode, null, 2));
  if (mode.mode !== 'md' || !mode.hasTextarea) {
    throw new Error(`OSChina: Markdown textarea not ready (mode=${mode.mode}) — HARD STOP`);
  }
  sleepJitter(1, 3);

  const fill = fillOschinaEditor(pid, ZH_TITLE, body);
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
  const href = evaluate(pid, `() => ({ href: location.href }))`);
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

async function zhihu(submit) {
  const body = readZhBody();
  const pid = openUrl('https://zhuanlan.zhihu.com/write');
  spawnSync('sleep', ['3']);
  const fill = evaluate(
    pid,
    `() => {
      ${SET_NATIVE}
      const title = ${esc(ZH_TITLE)};
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

  evaluate(pid, `() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.innerText?.trim() === '发布' && !b.disabled);
    btn?.click();
    return { clicked: !!btn };
  }`);
  spawnSync('sleep', ['5']);
  const href = evaluate(pid, `() => ({ href: location.href }))`);
  return { fill, href };
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
      console.log(JSON.stringify(await xLongform(submit), null, 2));
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
