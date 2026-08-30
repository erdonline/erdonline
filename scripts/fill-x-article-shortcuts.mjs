#!/usr/bin/env node
/**
 * Fill X Premium Article — thin CLI over compile + runFill (draft-only default).
 *
 * Usage:
 *   node scripts/fill-x-article-shortcuts.mjs [--slug=dont-give-agent-prod-db] [--pageId=N]
 *   [--audit] [--inserts-only] [--dump-payload=path.json] [--compile-only]
 *
 * --submit → exit 1 BEFORE any chrome-devtools spawn (hard block).
 * Unknown flag → exit 1.
 */
import fs from 'node:fs';
import { cdt } from './growth/lib/x-article-cdp-guarded.mjs';
import { compileArticle } from './growth/lib/x-article-compile.mjs';
import { attachEditor, resolveEditPageId } from './growth/lib/x-article-open-editor.mjs';
import { runFill, runInsertsOnly } from './growth/lib/x-article-play.mjs';

function parseArgs(argv) {
  let slug = 'dont-give-agent-prod-db';
  let pageId = null;
  let dumpPayload = null;
  let compileOnly = false;
  let audit = false;
  let insertsOnly = false;
  let submit = false;

  for (const arg of argv) {
    if (arg.startsWith('--slug=')) {
      slug = arg.slice(7);
      continue;
    }
    if (arg.startsWith('--pageId=')) {
      pageId = arg.slice(9);
      continue;
    }
    if (arg.startsWith('--dump-payload=')) {
      dumpPayload = arg.slice(15);
      continue;
    }
    if (arg === '--compile-only') {
      compileOnly = true;
      continue;
    }
    if (arg === '--audit') {
      audit = true;
      continue;
    }
    if (arg === '--inserts-only') {
      insertsOnly = true;
      continue;
    }
    if (arg === '--submit') {
      submit = true;
      continue;
    }
    console.error(`Unknown flag: ${arg}`);
    process.exit(1);
  }

  return { slug, pageId, dumpPayload, compileOnly, audit, insertsOnly, submit };
}

const { slug, pageId, dumpPayload, compileOnly, audit, insertsOnly, submit } = parseArgs(process.argv.slice(2));

if (submit) {
  console.error('HARD STOP: --submit blocked — X Article draft-only unless user explicitly requests publish');
  process.exit(1);
}

const payload = compileArticle(slug);

console.log(`slug=${slug} mode=${insertsOnly ? 'inserts-only' : 'compile-once-paste-play'}`);
console.log(`title=${JSON.stringify(payload.title)}`);
console.log(`html_len=${payload.html.length} plain_len=${payload.plain.length}`);
console.log(
  `insertPlan=${JSON.stringify(payload.insertPlan.map((e) => ({ kind: e.kind, playOrder: e.playOrder, anchor: e.anchor?.type })))}`,
);
console.log(`postPasteActions=${payload.postPasteActions.length} (links only)`);
console.log(`h2_count=${payload.meta.h2Texts.length} text_blocks=${payload.meta.textBlockCount}`);

if (dumpPayload) {
  fs.writeFileSync(dumpPayload, JSON.stringify(payload, null, 2));
  console.log(`payload written: ${dumpPayload}`);
}

if (compileOnly) {
  console.log('compile-only: skipping Chrome playback');
  process.exit(0);
}

try {
  cdt(['status']);
  const resolvedPageId = resolveEditPageId(pageId);
  attachEditor(resolvedPageId);

  const fillFn = insertsOnly ? runInsertsOnly : runFill;
  const result = fillFn(payload, { pageId: resolvedPageId, auditStrict: audit });
  console.log(`${insertsOnly ? 'inserts' : 'fill'} log:`, JSON.stringify(result.log, null, 2));
  console.log('snapshot:', JSON.stringify({
    titleLen: result.snapshot.titleLen,
    bodyLength: result.snapshot.bodyLength,
    blockCount: result.snapshot.blockCount,
    h2Count: result.snapshot.h2Count,
    strongCount: result.snapshot.strongCount,
    boldSpanCount: result.snapshot.boldSpanCount,
    boldCount: result.snapshot.boldCount,
    linkCount: result.snapshot.linkCount,
    codeBlockCount: result.snapshot.codeBlockCount,
    tableCount: result.snapshot.tableCount,
    href: result.snapshot.href,
  }));

  if (!audit && result.audit.errors.length) {
    console.warn('audit warnings (non-fatal without --audit):', result.audit.errors);
  }

  process.exit(audit && !result.audit.ok ? 1 : 0);
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
