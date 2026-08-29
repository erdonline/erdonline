#!/usr/bin/env node
/**
 * Convert SVG to PNG using the repo's Playwright install.
 *
 * Usage:
 *   node scripts/svg-to-png.mjs --input frontend/public/logo.svg --output frontend/public/logo-400x400.png --width 400 --height 400
 */

import { chromium } from '/Users/liangcan9/cursor/erdonline/frontend/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { input: '', output: '', width: 400, height: 400, wait: 500 };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
        opts.input = args[++i];
        break;
      case '--output':
        opts.output = args[++i];
        break;
      case '--width':
        opts.width = parseInt(args[++i], 10);
        break;
      case '--height':
        opts.height = parseInt(args[++i], 10);
        break;
      case '--wait':
        opts.wait = parseInt(args[++i], 10);
        break;
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs();
  if (!opts.input || !fs.existsSync(opts.input)) {
    console.error('Missing or invalid --input');
    process.exit(1);
  }
  if (!opts.output) {
    console.error('Missing --output');
    process.exit(1);
  }

  const inputPath = path.resolve(opts.input);
  const outputPath = path.resolve(opts.output);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: opts.width, height: opts.height },
  });

  const url = 'file://' + inputPath;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(opts.wait);

  await page.screenshot({
    path: outputPath,
    type: 'png',
    clip: { x: 0, y: 0, width: opts.width, height: opts.height },
  });

  await browser.close();
  console.log(`Wrote ${outputPath} (${opts.width}x${opts.height})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
