/**
 * Audit tests — classifyPaste + auditSnapshot + garbage (no Chrome).
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyPaste, auditSnapshot } from './x-article-audit.mjs';
import { expectedStrongCount } from './x-article-bold.mjs';
import { compileArticle } from './x-article-compile.mjs';
import { detectGarbagePrefix } from './x-article-garbage.mjs';

test('detectGarbagePrefix catches CDP stutter', () => {
  assert.equal(detectGarbagePrefix('TTTEEEFFriday night'), 'stutter-prefix');
  assert.equal(detectGarbagePrefix('RROR: column'), 'stutter-prefix');
  assert.equal(detectGarbagePrefix('Friday night'), null);
});

test('detectGarbagePrefix catches T-stutter and mixed stutter', () => {
  assert.equal(detectGarbagePrefix('TTTFriday night'), 'stutter-prefix');
  assert.equal(detectGarbagePrefix('TTEFfriday night'), 'mixed-stutter-prefix');
  assert.equal(
    detectGarbagePrefix('TTEFfriday night', 'Friday night'),
    'mixed-stutter-prefix',
  );
  assert.equal(detectGarbagePrefix('Friday night', 'Friday night'), null);
});

test('classifyPaste strong when thresholds met', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  const snap = {
    bodyLength: payload.plain.length,
    blockCount: payload.meta.textBlockCount,
    firstBlockText: payload.meta.firstPlainLine,
    isArticleEdit: true,
    isPostComposer: false,
    titleValue: payload.title,
  };
  assert.equal(classifyPaste(snap, payload), 'strong');
});

test('classifyPaste empty when bodyLength < 20', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  assert.equal(classifyPaste({ bodyLength: 5, blockCount: 1, firstBlockText: '' }, payload), 'empty');
});

test('classifyPaste weak when blockCount low', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  const snap = {
    bodyLength: payload.plain.length,
    blockCount: 1,
    firstBlockText: payload.meta.firstPlainLine,
  };
  assert.equal(classifyPaste(snap, payload), 'weak');
});

test('classifyPaste weak when bodyLength just below 0.85 plainLength', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  const weakBodyLength = Math.floor(payload.plain.length * 0.85) - 1;
  const snap = {
    bodyLength: weakBodyLength,
    blockCount: payload.meta.textBlockCount,
    firstBlockText: payload.meta.firstPlainLine,
  };
  assert.equal(classifyPaste(snap, payload), 'weak');
});

test('classifyPaste weak when firstBlockText drops leading F (riday night)', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  const snap = {
    bodyLength: payload.plain.length,
    blockCount: payload.meta.textBlockCount,
    firstBlockText: 'riday night. You ask Cursor for a query',
  };
  assert.equal(classifyPaste(snap, payload), 'weak');
});

test('auditSnapshot ok on strong paste + matching title', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  const snap = {
    href: 'https://x.com/compose/articles/edit/123',
    isArticleEdit: true,
    isPostComposer: false,
    titleValue: payload.title,
    bodyLength: payload.plain.length,
    blockCount: payload.meta.textBlockCount,
    firstBlockText: payload.meta.firstPlainLine,
    bodyHead: payload.meta.firstPlainLine,
    h2Count: payload.meta.h2Texts.length,
    strongCount: expectedStrongCount(payload.html),
    boldCount: expectedStrongCount(payload.html),
  };
  const audit = auditSnapshot(snap, payload);
  assert.equal(audit.ok, true);
  assert.equal(audit.errors.length, 0);
});

test('auditSnapshot errors on title mismatch', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  const snap = {
    href: 'https://x.com/compose/articles/edit/123',
    isArticleEdit: true,
    isPostComposer: false,
    titleValue: 'wrong title',
    bodyLength: payload.plain.length,
    blockCount: payload.meta.textBlockCount,
    firstBlockText: payload.meta.firstPlainLine,
    h2Count: payload.meta.h2Texts.length,
  };
  const audit = auditSnapshot(snap, payload);
  assert.ok(audit.errors.some((e) => e.includes('title mismatch')));
});

test('auditSnapshot errors on garbage prefix', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  const snap = {
    href: 'https://x.com/compose/articles/edit/123',
    isArticleEdit: true,
    isPostComposer: false,
    titleValue: payload.title,
    bodyLength: payload.plain.length,
    blockCount: payload.meta.textBlockCount,
    firstBlockText: 'TTTEEEFFriday night',
    h2Count: payload.meta.h2Texts.length,
  };
  const audit = auditSnapshot(snap, payload);
  assert.ok(audit.errors.some((e) => e.includes('garbage prefix')));
});

test('auditSnapshot ok=false on weak paste (bodyLength just below 0.85)', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  const weakBodyLength = Math.floor(payload.plain.length * 0.85) - 1;
  const snap = {
    href: 'https://x.com/compose/articles/edit/123',
    isArticleEdit: true,
    isPostComposer: false,
    titleValue: payload.title,
    bodyLength: weakBodyLength,
    blockCount: payload.meta.textBlockCount,
    firstBlockText: payload.meta.firstPlainLine,
    h2Count: payload.meta.h2Texts.length,
  };
  const audit = auditSnapshot(snap, payload);
  assert.equal(audit.ok, false);
  assert.ok(
    audit.errors.some((e) => e.startsWith('paste not strong (weak):')),
    `expected paste not strong error, got ${JSON.stringify(audit.errors)}`,
  );
});

test('auditSnapshot errors on riday first-letter-drop', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  const snap = {
    href: 'https://x.com/compose/articles/edit/123',
    isArticleEdit: true,
    isPostComposer: false,
    titleValue: payload.title,
    bodyLength: payload.plain.length,
    blockCount: payload.meta.textBlockCount,
    firstBlockText: 'riday night. You ask Cursor for a query',
    h2Count: payload.meta.h2Texts.length,
  };
  const audit = auditSnapshot(snap, payload);
  assert.equal(audit.ok, false);
  assert.ok(audit.errors.some((e) => e.includes('paste not strong')));
  assert.ok(audit.errors.some((e) => e.includes('first-letter-drop (riday)')));
});

test('auditSnapshot errors when h2Count below expected (all H2s required)', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  const snap = {
    href: 'https://x.com/compose/articles/edit/123',
    isArticleEdit: true,
    isPostComposer: false,
    titleValue: payload.title,
    bodyLength: payload.plain.length,
    blockCount: payload.meta.textBlockCount,
    firstBlockText: payload.meta.firstPlainLine,
    h2Count: payload.meta.h2Texts.length - 2,
    strongCount: expectedStrongCount(payload.html),
    boldCount: expectedStrongCount(payload.html),
  };
  const audit = auditSnapshot(snap, payload);
  assert.equal(audit.ok, false);
  assert.ok(audit.errors.some((e) => e.includes('h2Count=')));
});

test('auditSnapshot errors when h2Count=1 (was warning-only)', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  const snap = {
    href: 'https://x.com/compose/articles/edit/123',
    isArticleEdit: true,
    isPostComposer: false,
    titleValue: payload.title,
    bodyLength: payload.plain.length,
    blockCount: payload.meta.textBlockCount,
    firstBlockText: payload.meta.firstPlainLine,
    h2Count: 1,
    strongCount: expectedStrongCount(payload.html),
    boldCount: expectedStrongCount(payload.html),
  };
  const audit = auditSnapshot(snap, payload);
  assert.equal(audit.ok, false);
  assert.ok(audit.errors.some((e) => e.includes('h2Count=')));
});

test('auditSnapshot errors when bold stripped (boldCount=0)', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  const snap = {
    href: 'https://x.com/compose/articles/edit/123',
    isArticleEdit: true,
    isPostComposer: false,
    titleValue: payload.title,
    bodyLength: payload.plain.length,
    blockCount: payload.meta.textBlockCount,
    firstBlockText: payload.meta.firstPlainLine,
    h2Count: payload.meta.h2Texts.length,
    strongCount: 0,
    boldCount: 0,
  };
  const audit = auditSnapshot(snap, payload);
  assert.ok(audit.errors.some((e) => e.startsWith('bold stripped:')));
});

test('auditSnapshot warns on glued-paragraph (blockCount=1)', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  const snap = {
    href: 'https://x.com/compose/articles/edit/123',
    isArticleEdit: true,
    isPostComposer: false,
    titleValue: payload.title,
    bodyLength: payload.plain.length,
    blockCount: 1,
    firstBlockText: payload.meta.firstPlainLine,
    h2Count: payload.meta.h2Texts.length,
  };
  const audit = auditSnapshot(snap, payload);
  assert.equal(audit.ok, false, 'glued paste is also weak paste');
  assert.ok(audit.errors.some((e) => e.startsWith('paste not strong')));
  assert.ok(
    audit.warnings.some((w) => w.includes('glued-paragraph')),
    `expected glued-paragraph warning, got ${JSON.stringify(audit.warnings)}`,
  );
});
