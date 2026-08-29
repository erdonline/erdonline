#!/usr/bin/env node
/**
 * ONLY legal chrome-devtools typing entry for X long-form (MCP agents must use this).
 *
 * Usage:
 *   node scripts/cdp-type-if-article.mjs assert_url --pageId=9
 *   node scripts/cdp-type-if-article.mjs type_text --pageId=9 --text="hello"
 *   node scripts/cdp-type-if-article.mjs press_key --pageId=9 --key=Enter
 *   node scripts/cdp-type-if-article.mjs evaluate_script --pageId=9 --fn='() => ({ href: location.href })' [--typing]
 *
 * Throws before any typing if URL is compose/post or not Article composer.
 * Do NOT call raw `chrome-devtools type_text` / `evaluate_script` for X essay content.
 */

import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertXArticleEditUrl,
  BROWSER_ARTICLE_URL_GUARD,
  pageUrlFromList,
  wrapEvaluateWithArticleGuard,
} from './growth/lib/chrome-devtools-type-guard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NODE22 = path.join(os.homedir(), '.nvm/versions/node/v22.22.0/bin');

function usage() {
  console.error(`Usage: node scripts/cdp-type-if-article.mjs <command> --pageId=N [options]

Commands:
  assert_url       — Node + browser guard; exit 0 only on compose/articles/edit/<id>
  type_text        — --text=...
  press_key        — --key=Enter
  evaluate_script  — --fn='...' [--args='[]'] [--typing] (prepend browser guard when --typing)

Never use raw chrome-devtools type_text/insertText for X long-form.`);
  process.exit(1);
}

function cdt(args) {
  const r = spawnSync('npx', ['-y', '--package=chrome-devtools-mcp', 'chrome-devtools', ...args], {
    env: { ...process.env, PATH: `${NODE22}:${process.env.PATH}` },
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) {
    console.error((r.stderr || r.stdout || '').trim());
    process.exit(r.status ?? 1);
  }
  return (r.stdout || '').trim();
}

function getPageHref(pageId) {
  const pages = JSON.parse(cdt(['list_pages', '--output-format=json']));
  const url = pageUrlFromList(pages, pageId);
  if (url) return url;
  const raw = cdt([
    'evaluate_script',
    `() => ({ href: location.href })`,
    `--pageId=${pageId}`,
    '--output-format=json',
  ]);
  try {
    const parsed = JSON.parse(raw);
    return parsed.href ?? parsed.message?.match(/"href"\s*:\s*"([^"]+)"/)?.[1] ?? '';
  } catch {
    return '';
  }
}

function requireEditEditor(pageId) {
  const href = getPageHref(pageId);
  assertXArticleEditUrl(href);
  return href;
}

function parseArgs(argv) {
  const opts = { command: argv[0], pageId: null, text: '', key: '', fn: '', args: '[]', typing: false };
  if (!opts.command) usage();
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--pageId=')) opts.pageId = Number(a.slice(9));
    else if (a.startsWith('--text=')) opts.text = a.slice(7);
    else if (a.startsWith('--key=')) opts.key = a.slice(6);
    else if (a.startsWith('--fn=')) opts.fn = a.slice(5);
    else if (a.startsWith('--args=')) opts.args = a.slice(7);
    else if (a === '--typing') opts.typing = true;
  }
  if (opts.pageId == null || Number.isNaN(opts.pageId)) usage();
  return opts;
}

const opts = parseArgs(process.argv.slice(2));

try {
  cdt(['status']);
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}

switch (opts.command) {
  case 'assert_url': {
    const href = requireEditEditor(opts.pageId);
    const browser = cdt([
      'evaluate_script',
      BROWSER_ARTICLE_URL_GUARD,
      `--pageId=${opts.pageId}`,
      '--output-format=json',
    ]);
    console.log(JSON.stringify({ ok: true, href, browser }, null, 2));
    break;
  }
  case 'type_text': {
    requireEditEditor(opts.pageId);
    if (!opts.text) usage();
    cdt(['type_text', String(opts.pageId), opts.text]);
    console.log(JSON.stringify({ ok: true, action: 'type_text', len: opts.text.length }));
    break;
  }
  case 'press_key': {
    requireEditEditor(opts.pageId);
    if (!opts.key) usage();
    cdt(['press_key', String(opts.pageId), opts.key]);
    console.log(JSON.stringify({ ok: true, action: 'press_key', key: opts.key }));
    break;
  }
  case 'evaluate_script': {
    if (!opts.fn) usage();
    if (opts.typing) requireEditEditor(opts.pageId);
    const fn = opts.typing ? wrapEvaluateWithArticleGuard(opts.fn) : opts.fn;
    const cli = ['evaluate_script', fn, `--pageId=${opts.pageId}`, '--output-format=json'];
    if (opts.args && opts.args !== '[]') cli.push(`--args=${opts.args}`);
    console.log(cdt(cli));
    break;
  }
  default:
    usage();
}
