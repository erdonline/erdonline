/**
 * Bold chord decision tests — no Chrome.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectMarkPhrases,
  expectedStrongCount,
  payloadHasStrong,
  shouldApplyBoldChords,
} from './x-article-bold.mjs';
import { compileArticle } from './x-article-compile.mjs';
import { buildBlocks } from './x-article-block-ir.mjs';

test('payloadHasStrong detects compile HTML', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  assert.equal(payloadHasStrong(payload.html), true);
  assert.equal(payloadHasStrong('<p>plain</p>'), false);
});

test('shouldApplyBoldChords: chord when paste stripped strong', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  assert.equal(shouldApplyBoldChords({ strongCount: 0 }, payload.html), true);
});

test('shouldApplyBoldChords: skip when paste kept strong', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  assert.equal(shouldApplyBoldChords({ strongCount: 3 }, payload.html), false);
});

test('shouldApplyBoldChords: skip when payload has no strong', () => {
  assert.equal(shouldApplyBoldChords({ strongCount: 0 }, '<p>plain</p>'), false);
});

test('collectMarkPhrases from Job1 blocks includes invented column', () => {
  const blocks = buildBlocks('dont-give-agent-prod-db');
  const phrases = collectMarkPhrases(blocks);
  assert.ok(phrases.includes('invented column'));
  assert.ok(phrases.includes('do not look like errors'));
});

test('compile meta.markPhrases populated for Job1', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  assert.ok(payload.meta.markPhrases?.includes('invented column'));
  assert.ok(payload.meta.markPhrases.length >= 10);
  assert.ok(expectedStrongCount(payload.html) >= 10);
});
