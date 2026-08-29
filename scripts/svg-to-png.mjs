#!/usr/bin/env node
/**
 * Convert SVG to PNG, cropping tightly to the drawn elements (no blank margins).
 *
 * Usage:
 *   node scripts/svg-to-png.mjs --input frontend/public/logo.svg --output frontend/public/logo-400x400.png --width 400 --height 400
 */

import { chromium } from '/Users/liangcan9/cursor/erdonline/frontend/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { input: '', output: '', width: 400, height: 400 };
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
  const svgText = fs.readFileSync(inputPath, 'utf-8');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: opts.width, height: opts.height },
  });

  // Inject SVG into an empty page so we can measure its real content bbox.
  await page.setContent(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent;}</style></head>
<body id="body">${svgText}</body>
</html>`);

  await page.waitForTimeout(300);

  // Compute the tight bounding box around every rendered SVG element, then
  // re-fit the <svg> to fill the output viewport with no blank margins.
  const fitResult = await page.evaluate(({ width, height }) => {
    const svg = document.querySelector('svg');
    if (!svg) return { error: 'No <svg> found' };

    // Get the union bbox of all graphical elements.
    const elements = [...svg.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon, text, g, use, image')];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const el of elements) {
      try {
        const bbox = el.getBBox();
        if (bbox.width === 0 && bbox.height === 0) continue;
        minX = Math.min(minX, bbox.x);
        minY = Math.min(minY, bbox.y);
        maxX = Math.max(maxX, bbox.x + bbox.width);
        maxY = Math.max(maxY, bbox.y + bbox.height);
      } catch {
        // Some elements (e.g. <use>) may not support getBBox in all browsers.
      }
    }

    if (!Number.isFinite(minX)) {
      // Fallback to svg's own bbox if no children reported a size.
      const bbox = svg.getBBox ? svg.getBBox() : { x: 0, y: 0, width: 0, height: 0 };
      minX = bbox.x; minY = bbox.y; maxX = bbox.x + bbox.width; maxY = bbox.y + bbox.height;
    }

    const contentW = maxX - minX;
    const contentH = maxY - minY;
    if (contentW <= 0 || contentH <= 0) return { error: 'Empty SVG content bbox' };

    const contentRatio = contentW / contentH;
    const targetRatio = width / height;

    let outW, outH;
    if (contentRatio > targetRatio) {
      // Content is wider than target: fit width, center vertically.
      outW = width;
      outH = Math.round(width / contentRatio);
    } else {
      // Content is taller than target: fit height, center horizontally.
      outH = height;
      outW = Math.round(height * contentRatio);
    }

    // Strip the original width/height/viewBox and set a fresh viewBox that
    // exactly matches the content, then scale to the computed output size.
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('viewBox', `${minX} ${minY} ${contentW} ${contentH}`);
    svg.setAttribute('width', String(outW));
    svg.setAttribute('height', String(outH));
    svg.style.display = 'block';

    return { minX, minY, contentW, contentH, outW, outH };
  }, { width: opts.width, height: opts.height });

  if (fitResult.error) {
    await browser.close();
    console.error(fitResult.error);
    process.exit(1);
  }

  // Position the <svg> centered in the viewport to keep the image size exact.
  await page.evaluate(({ width, height }) => {
    const svg = document.querySelector('svg');
    const rect = svg.getBoundingClientRect();
    const padLeft = Math.max(0, (width - rect.width) / 2);
    const padTop = Math.max(0, (height - rect.height) / 2);
    svg.style.marginLeft = padLeft + 'px';
    svg.style.marginTop = padTop + 'px';
  }, { width: opts.width, height: opts.height });

  await page.waitForTimeout(100);
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
