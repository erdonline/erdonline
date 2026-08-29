#!/usr/bin/env node
/**
 * Fix empty-body posts on OSChina + Zhihu via chrome-devtools CLI.
 * 仅修历史空帖，日常发帖走 post-seo-essay.mjs / platform-post-recipes.md。
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ARTICLE = path.join(ROOT, 'content/articles/cursor-mcp-read-and-suggest-version.juejin.md');
const NODE22 = path.join(os.homedir(), '.nvm/versions/node/v22.22.0/bin');
const TITLE = 'Cursor 连上 MCP：读一张 ER 图，提交一版建议';

function cdt(args, { json = false } = {}) {
  const cmdArgs = ['-y', '--package=chrome-devtools-mcp', 'chrome-devtools', ...args];
  if (json) cmdArgs.push('--output-format=json');
  const r = spawnSync('npx', cmdArgs, {
    env: { ...process.env, PATH: `${NODE22}:${process.env.PATH}` },
    encoding: 'utf-8',
    maxBuffer: 16 * 1024 * 1024,
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

function evaluate(pageId, fn) {
  return parseEval(cdt(['evaluate_script', fn, `--pageId=${pageId}`], { json: true }));
}

function selectedPageId() {
  const raw = cdt(['list_pages'], { json: true });
  const pages = JSON.parse(raw);
  const list = pages?.pages || pages;
  const sel = list.find((p) => p.selected) || list[list.length - 1];
  return sel.id;
}

function openUrl(url) {
  cdt(['new_page', url, '--timeout=30000']);
  return selectedPageId();
}

function cleanBody() {
  let text = fs.readFileSync(ARTICLE, 'utf-8');
  return text.replace(/^# .+\n+/, '').trimEnd();
}

function esc(s) {
  return JSON.stringify(s);
}

function ensureOschinaMd(pageId) {
  const r = evaluate(pageId, `() => {
    const hasPre = !!document.querySelector('pre');
    const hasTiptap = !!document.querySelector('.tiptap');
    if (hasPre && !hasTiptap) return { mode: 'md', switched: false };
    const swap = document.querySelector('img[alt="swap"]')?.closest('div,span,button') || document.querySelector('img[alt="swap"]');
    swap?.click();
    return { mode: 'wysiwyg', clickedSwap: !!swap };
  }`);
  if (r.mode === 'wysiwyg') {
    evaluate(pageId, `() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.innerText.includes('确定切换'));
      btn?.click();
      return { confirmed: !!btn };
    }`);
  }
}

function fillOschina(pageId, body) {
  ensureOschinaMd(pageId);
  return evaluate(
    pageId,
    `() => {
      const title = ${esc(TITLE)};
      const body = ${esc(body)};
      const setNative = (el, value) => {
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const titleEl = document.querySelector('input[placeholder*="标题"], textarea[placeholder*="标题"]');
      if (titleEl) setNative(titleEl, title);
      const ta = [...document.querySelectorAll('textarea')].find(t => t.offsetWidth > 100 && !(t.placeholder || '').includes('标题'))
        || document.querySelector('textarea');
      if (ta) setNative(ta, body);
      const pre = document.querySelector('pre');
      const half = Math.floor((ta?.value?.length || 0) / 2);
      return {
        titleLen: titleEl?.value?.length ?? 0,
        textareaLen: ta?.value?.length ?? 0,
        preLen: pre?.textContent?.length ?? 0,
        newlineCount: (ta?.value?.match(/\\n/g) || []).length,
        possibleDuplicate: ta?.value && ta.value.slice(0, half) === ta.value.slice(half),
        preview: ta?.value?.slice(0, 80),
        isChinese: /[\\u4e00-\\u9fff]/.test(ta?.value || ''),
      };
    }`,
  );
}

function submitOschina(pageId) {
  const r1 = evaluate(pageId, `() => {
    const btn = [...document.querySelectorAll('button')].find(b => /发布文章|更新/.test(b.innerText));
    btn?.click();
    return { clicked: !!btn, text: btn?.innerText?.trim() };
  }`);
  return r1;
}

function confirmOschinaDialog(pageId) {
  return evaluate(pageId, `() => {
    const btn = [...document.querySelectorAll('button')].find(b => /确定并发布|确定/.test(b.innerText));
    btn?.click();
    return { confirmed: !!btn, text: btn?.innerText?.trim() };
  }`);
}

function verifyPublic(pageId, url, selector) {
  openUrl(url);
  const pid = selectedPageId();
  return evaluate(
    pid,
    `() => {
      const el = document.querySelector(${esc(selector)}) || document.querySelector('article, main');
      const text = el?.innerText || '';
      const chinese = (text.match(/[\\u4e00-\\u9fff]/g) || []).length;
      const title = document.querySelector('h1')?.innerText || document.title;
      return { href: location.href, title, bodyLen: text.length, chinese, preview: text.slice(0, 200) };
    }`,
  );
}

function fillZhihu(pageId, body) {
  return evaluate(
    pageId,
    `() => {
      const title = ${esc(TITLE)};
      const body = ${esc(body)};
      const setNative = (el, value) => {
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const titleEl = document.querySelector('textarea[placeholder*="标题"], input[placeholder*="标题"]');
      if (titleEl) setNative(titleEl, title);

      const results = { methods: [] };

      // Hidden textarea (often what publish API reads)
      for (const ta of document.querySelectorAll('textarea')) {
        if (ta === titleEl) continue;
        setNative(ta, body);
        results.methods.push({ target: 'textarea', hidden: !ta.offsetParent, len: ta.value.length, name: ta.name });
      }

      // Draft.js / contenteditable: clipboard paste simulation
      const ce = document.querySelector('[contenteditable="true"].public-DraftEditor-content, [contenteditable="true"]');
      if (ce) {
        ce.focus();
        const dt = new DataTransfer();
        dt.setData('text/plain', body);
        ce.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt }));
        results.methods.push({ target: 'clipboard paste', len: ce.innerText?.length ?? 0 });
      }

      const hiddenTa = [...document.querySelectorAll('textarea')].filter(t => t !== titleEl);
      const bestTa = hiddenTa.sort((a, b) => b.value.length - a.value.length)[0];
      return {
        titleLen: titleEl?.value?.length ?? 0,
        textareaBestLen: bestTa?.value?.length ?? 0,
        ceLen: ce?.innerText?.length ?? 0,
        newlineCount: (bestTa?.value?.match(/\\n/g) || []).length,
        methods: results.methods,
        isChinese: /[\\u4e00-\\u9fff]/.test(bestTa?.value || ce?.innerText || ''),
      };
    }`,
  );
}

function submitZhihu(pageId) {
  return evaluate(pageId, `() => {
    const btn = [...document.querySelectorAll('button')].find(b => /发布|更新/.test(b.innerText) && !b.disabled);
    btn?.click();
    return { clicked: !!btn, text: btn?.innerText?.trim() };
  }`);
}

const cmd = process.argv[2];
const body = cleanBody();

try {
  switch (cmd) {
    case 'oschina-fill': {
      const pid = openUrl('https://my.oschina.net/u/3339242/blog/ai-write?id=19750362');
      console.log('pageId', pid, 'sourceLen', body.length);
      console.log(JSON.stringify(fillOschina(pid, body), null, 2));
      break;
    }
    case 'oschina-submit': {
      const pid = selectedPageId();
      console.log('submit', JSON.stringify(submitOschina(pid)));
      spawnSync('sleep', ['2']);
      console.log('confirm', JSON.stringify(confirmOschinaDialog(pid)));
      break;
    }
    case 'oschina-verify':
      console.log(JSON.stringify(verifyPublic(null, 'https://my.oschina.net/u/3339242/blog/19750362', '.blog-content, .article-content, .detail-body, main'), null, 2));
      break;
    case 'zhihu-fill': {
      const pid = openUrl('https://zhuanlan.zhihu.com/p/2077045243858392500/edit');
      console.log('pageId', pid);
      console.log(JSON.stringify(fillZhihu(pid, body), null, 2));
      break;
    }
    case 'zhihu-submit': {
      const pid = selectedPageId();
      console.log(JSON.stringify(submitZhihu(pid), null, 2));
      break;
    }
    case 'zhihu-verify':
      console.log(JSON.stringify(verifyPublic(null, 'https://zhuanlan.zhihu.com/p/2077045243858392500', '.Post-RichText, .RichText, article'), null, 2));
      break;
    default:
      console.log('Usage: oschina-fill | oschina-submit | oschina-verify | zhihu-fill | zhihu-submit | zhihu-verify');
  }
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
