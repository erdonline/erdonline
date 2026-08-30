/** X Article pack config — content file, title, block IR. Single fill script reads these. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../../..');

export const PACKS = {
  'dont-give-agent-prod-db': {
    file: path.join(ROOT, 'docs/growth-content/dont-give-agent-prod-db-x.md'),
    title: "Don't give your agent the production database",
    preview: {
      minLen: 5000,
      spacingMaxTriple: 2,
      checks: {
        hasInventedColumn: (t) => t.toLowerCase().includes('invented column'),
        hasGithub: (t) => t.includes('github.com/erd-online') || t.includes('github.com/erdonline'),
        hasDemo: (t) => t.includes('erdonline.com/demo'),
      },
    },
  },
  'seo-essay': {
    file: path.join(ROOT, 'docs/growth-content/2026-08-29-seo-essay-x.md'),
    title: 'Average position 1. Zero clicks. Our site had eight URLs and one identity.',
    editUrl: 'https://x.com/compose/articles/edit/2093657683534745600',
    publicUrl: 'https://x.com/BuilderLiang/article/2093653160195948997',
    headings: new Set([
      'THE DIAGNOSIS TAKES ONE COMMAND',
      'FOUR ARTIFACTS, ONE SOURCE OF TRUTH',
      'THE TITLE PROBLEM WAS A PROMISE PROBLEM',
      "WHAT WE'RE BUILDING",
    ]),
    subheadings: new Set([
      'TWO PLATFORM DEFAULTS, BOTH DOCUMENTED, BOTH EASY TO MISS',
      'TWO BUGS THAT ONLY EXIST IN SINGLE-PAGE APPS',
      "MAKE THE CRAWLER'S VIEW A TEST",
      'WHAT WE STOPPED DOING',
      'THE SCOREBOARD, HONESTLY',
      'THE CHECKLIST',
    ]),
    footguns: [
      'A rewrite target of /index.html doesn\'t work, because Cloudflare 308-redirects *.html to its extension-less form, so an invisible rewrite becomes a redirect to the root.',
      'The splat in "/catalog/* → / 200" matches /catalog/ with an empty segment, so the catch-all silently shadowed the list-page shell we had just generated; it has to be /catalog/:id.',
      'We first sent unknown template IDs to a placeholder shell at /catalog/_item — because that path is a directory, Cloudflare 308\'d the bad ID onto /catalog/_item/, so we invented a brand-new crawlable junk URL while trying to clean up crawlable junk URLs.',
    ],
    notDo: [
      'We don\'t claim "file viewer": it\'s a plausible high-volume phrase, we support ERD/PdMan/DBML import, and we do not ship a dedicated file viewer — ranking for a query you can\'t satisfy buys one visit and one bounce.',
      'We don\'t name Google Draw: our comparison page names draw.io because we have a real technical claim there, that a line in draw.io is a line while a relationship in ERD Online carries foreign-key semantics, and we won\'t name a product we haven\'t actually compared.',
      'We don\'t stuff the non-English queries we can see in the report, because impressions from an audience we don\'t serve in their language aren\'t a win.',
    ],
    checklist: [
      'Curl a non-homepage URL and grep for title and canonical; if you see your homepage, stop and fix that first.',
      'Curl a path that definitely doesn\'t exist; if it\'s 200, you have unbounded soft 404s, and on Cloudflare Pages the fix is a root 404.html.',
      'Delete the catch-all rewrite and enumerate the SPA paths that genuinely need a 200.',
      'Make sitemap, prerendered shells, host rewrites and self-host rewrites derive from one module.',
      'Check that hydration isn\'t overwriting per-path metadata your build just wrote.',
      'Check that JSON-LD @type is per-page rather than the homepage type with a swapped url.',
      'Pick one trailing-slash form and make canonical, sitemap, host redirect and legacy redirects all agree.',
      'Turn every one of those into a daily assertion against production, because this bug class is silent by construction.',
    ],
    preview: {
      minLen: 8000,
      spacingMaxTriple: 2,
      checks: {
        hasSearchConsole: (t) => t.includes('Search Console'),
        hasGithub: (t) => t.includes('github.com/erdonline'),
      },
    },
  },
};

export function resolvePack(slug) {
  const key = slug || 'dont-give-agent-prod-db';
  const pack = PACKS[key];
  if (!pack) {
    throw new Error(
      `Unknown X Article pack "${key}". Known: ${Object.keys(PACKS).join(', ')}`,
    );
  }
  return pack;
}

export function readParagraphs(pack) {
  const text = fs.readFileSync(pack.file, 'utf-8');
  const marker = '## X body (paste as-is, below the line)';
  const idx = text.indexOf(marker);
  if (idx === -1) throw new Error(`X body marker not found in ${pack.file}`);
  let body = text.slice(idx + marker.length).trim();
  const tagIdx = body.indexOf('\n---\n\n## Platform tag lines');
  if (tagIdx !== -1) body = body.slice(0, tagIdx).trim();
  return body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}