#!/usr/bin/env node
/**
 * Cross-platform posting via chrome-devtools-mcp (NOT Playwright).
 *
 * Attaches to the already-logged-in Chrome through the `chrome-devtools` CLI
 * (`--autoConnect`, Chrome 144+). Enable once:
 *   chrome://inspect/#remote-debugging
 *
 * Usage:
 *   node scripts/post-all-browser.mjs --platform hackernews \
 *     --title "Show HN: …" --url https://www.erdonline.com --body-file docs/growth-content/2026-08-29-hacker-news.md
 *
 *   node scripts/post-all-browser.mjs --platform producthunt \
 *     --title "ERD Online" --body-file docs/growth-content/2026-08-29-product-hunt.md
 *
 * Flags:
 *   --platform producthunt | hackernews | reddit | x
 *   --title    post title
 *   --body-file path/to/body.md
 *   --url      link URL (HN / PH website)
 *   --subreddit cursor (reddit only)
 *   --submit   actually click Publish/Submit (off by default: fill only)
 *
 * X (--platform x): **short Post only (≤280 chars)**. Long-form / SEO essay /
 * growth-content *-x.md / content/articles/ → HARD STOP; use fill-x-article-shortcuts.mjs
 * + compose/articles instead. Script throws before opening compose/post.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertNotXPostEssay } from './growth/lib/assert-x-article-composer.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NODE22_CANDIDATES = [
  path.join(os.homedir(), '.nvm/versions/node/v22.22.0/bin'),
  '/opt/homebrew/opt/node@22/bin',
];

function node22Bin() {
  for (const dir of NODE22_CANDIDATES) {
    if (fs.existsSync(path.join(dir, 'node'))) return dir;
  }
  return '';
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    platform: 'producthunt',
    title: '',
    bodyFile: '',
    url: '',
    subreddit: 'cursor',
    submit: false,
  };
  for (let i = 0; i < args.length; i++) {
    const k = args[i];
    if (k === '--submit') {
      opts.submit = true;
      continue;
    }
    const v = args[++i];
    if (k === '--platform') opts.platform = v;
    if (k === '--title') opts.title = v;
    if (k === '--body-file') opts.bodyFile = v;
    if (k === '--url') opts.url = v;
    if (k === '--subreddit') opts.subreddit = v;
  }
  return opts;
}

function cleanBody(file) {
  if (!file || !fs.existsSync(file)) return '';
  let text = fs.readFileSync(file, 'utf-8');
  if (text.startsWith('---')) {
    const second = text.indexOf('---\n', 3);
    if (second !== -1) text = text.slice(second + 4);
  }
  text = text.replace(/^# .+\n+/, '');
  return text.trim();
}

function cdtEnv() {
  const bin = node22Bin();
  return {
    ...process.env,
    PATH: bin ? `${bin}:${process.env.PATH}` : process.env.PATH,
  };
}

function cdt(args, { json = false } = {}) {
  const cmdArgs = ['-y', '--package=chrome-devtools-mcp', 'chrome-devtools', ...args];
  if (json) cmdArgs.push('--output-format=json');
  const r = spawnSync('npx', cmdArgs, {
    env: cdtEnv(),
    encoding: 'utf-8',
    maxBuffer: 8 * 1024 * 1024,
  });
  if (r.status !== 0) {
    const err = (r.stderr || r.stdout || '').trim() || `exit ${r.status}`;
    throw new Error(`chrome-devtools ${args[0]} failed: ${err}`);
  }
  return (r.stdout || '').trim();
}

function ensureDaemon() {
  const status = spawnSync(
    'npx',
    ['-y', '--package=chrome-devtools-mcp', 'chrome-devtools', 'status'],
    { env: cdtEnv(), encoding: 'utf-8' },
  );
  const out = `${status.stdout || ''}${status.stderr || ''}`;
  const connected = /daemon is running/.test(out) && /auto-connect|autoConnect|--autoConnect/.test(out);
  if (!connected) {
    console.log('Starting chrome-devtools daemon with --autoConnect ...');
    cdt(['start', '--autoConnect', '--no-usage-statistics', '--no-headless']);
  }
}

function listPages() {
  const raw = cdt(['list_pages'], { json: true });
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function selectedPageId(pages) {
  const list = pages?.pages || pages;
  if (!Array.isArray(list) || list.length === 0) return 1;
  const selected = list.find((p) => p.selected) || list[list.length - 1];
  return selected.id ?? 1;
}

function evaluate(pageId, fn, args = []) {
  const cliArgs = ['evaluate_script', fn, `--pageId=${pageId}`];
  if (args.length) cliArgs.push(`--args=${JSON.stringify(args)}`);
  return cdt(cliArgs, { json: true });
}

function openUrl(url) {
  cdt(['new_page', url, '--timeout=30000']);
  const pages = listPages();
  return selectedPageId(pages);
}

function snapshot(pageId) {
  return cdt(['take_snapshot', String(pageId)]);
}

const FILL_FORM = `async (title, body, url) => {
  const setNative = (el, value) => {
    if (!el) return false;
    const proto = el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    desc?.set?.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  };
  const byName = (n) => document.querySelector(\`[name="\${n}"]\`);
  const titleEl =
    byName('title') ||
    document.querySelector('input[placeholder*="Title" i], input[aria-label*="title" i], textarea[placeholder*="Title" i]');
  const urlEl = byName('url') || document.querySelector('input[placeholder*="URL" i], input[type="url"]');
  const bodyEl =
    byName('text') ||
    document.querySelector('textarea, [contenteditable="true"][role="textbox"], [data-testid="tweetTextarea_0"]');
  const filled = {
    title: title ? setNative(titleEl, title) : false,
    url: url ? setNative(urlEl, url) : false,
    body: false,
  };
  if (body && bodyEl) {
    if (bodyEl.getAttribute('contenteditable') === 'true') {
      bodyEl.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, body);
      filled.body = true;
    } else {
      filled.body = setNative(bodyEl, body);
    }
  }
  return { filled, href: location.href, title: document.title };
}`;

const CLICK_SUBMIT = `() => {
  const btn = document.querySelector(
    'input[type="submit"], button[type="submit"], [data-testid="tweetButton"], [data-testid="tweetButtonInline"], [data-testid="submit-post-button"]'
  );
  if (!btn) return { clicked: false, reason: 'no submit button' };
  btn.click();
  return { clicked: true, text: btn.innerText || btn.value || '' };
}`;

async function postHackerNews({ title, url, body, submit }) {
  const pageId = openUrl('https://news.ycombinator.com/submit');
  console.log(evaluate(pageId, FILL_FORM, [title, body, url]));
  if (submit) console.log(evaluate(pageId, CLICK_SUBMIT));
  else console.log('Filled HN form. Re-run with --submit to click Submit. Snapshot:');
  console.log(snapshot(pageId));
}

async function postProductHunt({ title, body, url, submit }) {
  const pageId = openUrl('https://www.producthunt.com/posts/new');
  console.log(evaluate(pageId, FILL_FORM, [title, body, url]));
  if (submit) console.log(evaluate(pageId, CLICK_SUBMIT));
  else console.log('Opened Product Hunt new-post. Fill remaining gallery fields in Chrome. Snapshot:');
  console.log(snapshot(pageId));
}

async function postReddit({ title, body, subreddit, submit }) {
  const pageId = openUrl(`https://www.reddit.com/r/${subreddit}/submit/?type=TEXT`);
  console.log(evaluate(pageId, FILL_FORM, [title, body, '']));
  if (submit) console.log(evaluate(pageId, CLICK_SUBMIT));
  else console.log(`Filled r/${subreddit} composer (if logged in). Re-run with --submit to post. Snapshot:`);
  console.log(snapshot(pageId));
}

async function postX({ body, submit }) {
  const pageId = openUrl('https://x.com/compose/post');
  console.log(evaluate(pageId, FILL_FORM, ['', body, '']));
  if (submit) console.log(evaluate(pageId, CLICK_SUBMIT));
  else console.log('Filled X compose box. Re-run with --submit to post. Snapshot:');
  console.log(snapshot(pageId));
}

function main() {
  const opts = parseArgs();
  if (!opts.title && !opts.bodyFile) {
    console.error(
      'Usage: node scripts/post-all-browser.mjs --platform <producthunt|hackernews|reddit|x> --title "..." --body-file docs/growth-content/....md',
    );
    process.exit(1);
  }
  const body = cleanBody(opts.bodyFile);
  const slugArg = process.argv.find((a) => a.startsWith('--slug=')) ?? null;
  console.log(`Platform=${opts.platform} submit=${opts.submit}`);
  try {
    assertNotXPostEssay({
      platform: opts.platform,
      body,
      bodyFile: opts.bodyFile,
      slugArg,
    });
    ensureDaemon();
    const pages = listPages();
    if (typeof pages === 'string' && /Could not connect to Chrome/i.test(pages)) {
      console.error(pages);
      console.error('\nEnable chrome://inspect/#remote-debugging in the running Chrome, then:');
      console.error('  ./scripts/start-chrome-debug.sh');
      process.exit(1);
    }
    switch (opts.platform) {
      case 'producthunt':
        postProductHunt({ title: opts.title, body, url: opts.url, submit: opts.submit });
        break;
      case 'hackernews':
        postHackerNews({ title: opts.title, url: opts.url, body, submit: opts.submit });
        break;
      case 'reddit':
        postReddit({
          title: opts.title,
          body,
          subreddit: opts.subreddit,
          submit: opts.submit,
        });
        break;
      case 'x':
        postX({ body: body || opts.title, submit: opts.submit });
        break;
      default:
        console.error('Unknown platform:', opts.platform);
        process.exit(1);
    }
  } catch (err) {
    console.error(err.message || err);
    if (/Could not connect to Chrome|DevToolsActivePort/i.test(String(err))) {
      console.error('\nChrome 152 is running but remote debugging is off.');
      console.error('Open chrome://inspect/#remote-debugging → Allow, then retry.');
      console.error('Helper: ./scripts/start-chrome-debug.sh');
    }
    process.exit(1);
  }
}

main();
