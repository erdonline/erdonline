#!/usr/bin/env node
/**
 * Automated cross-platform posting by controlling the user's already-logged-in Chrome.
 *
 * This script connects to a Chrome instance running with --remote-debugging-port=9222,
 * then operates Product Hunt, Hacker News, Reddit, and X pages that are already logged in.
 *
 * Usage:
 *   1. Close all Chrome windows.
 *   2. Start Chrome with CDP:
 *      /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
 *        --remote-debugging-port=9222 \
 *        --user-data-dir="$HOME/Library/Application Support/Google/Chrome"
 *   3. Log in to the target platform in that Chrome window.
 *   4. node scripts/post-all-browser.mjs --platform producthunt
 *
 * Supports:
 *   --platform producthunt | hackernews | reddit | x
 *   --title  "Post title"
 *   --body-file path/to/body.md
 *   --url    https://example.com (for link posts)
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CDP_URL = process.env.CDP_URL || 'http://127.0.0.1:9222';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    platform: 'producthunt',
    title: '',
    bodyFile: '',
    url: '',
  };
  for (let i = 0; i < args.length; i += 2) {
    const k = args[i];
    const v = args[i + 1];
    if (k === '--platform') opts.platform = v;
    if (k === '--title') opts.title = v;
    if (k === '--body-file') opts.bodyFile = v;
    if (k === '--url') opts.url = v;
  }
  return opts;
}

function cleanBody(file) {
  if (!file || !fs.existsSync(file)) return '';
  let text = fs.readFileSync(file, 'utf-8');
  // Drop YAML/Markdown front matter
  if (text.startsWith('---')) {
    const second = text.indexOf('---\n', 3);
    if (second !== -1) text = text.slice(second + 4);
  }
  // Strip first '# Title'
  text = text.replace(/^# .+\n+/, '');
  return text.trim();
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function postProductHunt(page, { title, body }) {
  // Product Hunt: https://www.producthunt.com/posts/new
  await page.goto('https://www.producthunt.com/posts/new');
  // TODO: Fill fields once we know the exact selectors from a live page.
  console.log('Product Hunt posting not yet implemented. Title:', title);
}

async function postHackerNews(page, { title, url }) {
  await page.goto('https://news.ycombinator.com/submit');
  await page.fill('input[name="title"]', title);
  if (url) await page.fill('input[name="url"]', url);
  await page.click('input[type="submit"]');
  await wait(2000);
  console.log('Hacker News submitted:', title);
}

async function postReddit(page, { title, body, subreddit = 'cursor' }) {
  const url = `https://www.reddit.com/r/${subreddit}/submit`;
  await page.goto(url);
  // Reddit's form is React-based; wait for it to render
  await page.waitForSelector('textarea[placeholder*="body" i], [data-testid="post-composer__text"]', { timeout: 10000 });
  // Try common selectors
  const titleInput = await page.$('input[placeholder*="Title" i], [data-testid="post-title__input"]');
  if (titleInput) await titleInput.fill(title);
  const bodyInput = await page.$('textarea[placeholder*="body" i], [data-testid="post-composer__text"]');
  if (bodyInput && body) await bodyInput.fill(body);
  const submit = await page.$('button[type="submit"], [data-testid="submit-post-button"]');
  if (submit) await submit.click();
  await wait(3000);
  console.log('Reddit submitted to r/', subreddit, ':', title);
}

async function postX(page, { body }) {
  await page.goto('https://x.com/compose/post');
  await page.waitForSelector('div[contenteditable="true"][role="textbox"]', { timeout: 10000 });
  await page.fill('div[contenteditable="true"][role="textbox"]', body);
  const postButton = await page.$('button[data-testid="tweetButton"], button[data-testid="tweetButtonInline"]');
  if (postButton) await postButton.click();
  await wait(2000);
  console.log('X posted');
}

async function main() {
  const opts = parseArgs();
  if (!opts.title && !opts.bodyFile) {
    console.error('Usage: node scripts/post-all-browser.mjs --platform <name> --title "..." --body-file docs/...md');
    process.exit(1);
  }

  const body = cleanBody(opts.bodyFile);
  console.log(`Connecting to Chrome at ${CDP_URL}...`);

  const browser = await chromium.connectOverCDP(CDP_URL);
  const context = browser.contexts()[0] || await browser.newContext();
  const page = await context.newPage();

  try {
    switch (opts.platform) {
      case 'producthunt':
        await postProductHunt(page, { title: opts.title, body });
        break;
      case 'hackernews':
        await postHackerNews(page, { title: opts.title, url: opts.url });
        break;
      case 'reddit':
        await postReddit(page, { title: opts.title, body });
        break;
      case 'x':
        await postX(page, { body });
        break;
      default:
        console.error('Unknown platform:', opts.platform);
    }
  } finally {
    await page.close();
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
