#!/usr/bin/env node
/**
 * ONLY documented entry for publishing X long-form (Article composer).
 * Never opens compose/post — navigates compose/articles, clicks Create, then fill.
 *
 * Usage:
 *   node scripts/x-article-publish.mjs <slug> [--preview] [--submit] [--pageId=N]
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARTICLE_COMPOSE_URL } from './growth/lib/x-article-publish-lib.mjs';
import { resolvePack } from './growth/lib/x-article-packs.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith('--'));
if (!slug) {
  console.error(`Usage: node scripts/x-article-publish.mjs <slug> [--preview] [--submit] [--pageId=N]

Opens ${ARTICLE_COMPOSE_URL} → button[aria-label="create"] → node scripts/fill-x-article-shortcuts.mjs --slug=<slug>`);
  process.exit(1);
}

try {
  resolvePack(slug);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

const forward = args.filter((a) => a.startsWith('--'));
const r = spawnSync(
  'node',
  ['scripts/fill-x-article-shortcuts.mjs', `--slug=${slug}`, ...forward],
  { cwd: ROOT, stdio: 'inherit', encoding: 'utf-8' },
);
process.exit(r.status ?? 1);
