/**
 * Overlay commit + code language constants — no Chrome.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { compileArticle } from './x-article-compile.mjs';
import {
  CODE_BODY_PLACEHOLDER,
  CODE_LANGUAGE_INPUT_TESTID,
  CODE_LANGUAGE_SEARCH_LABEL,
  OVERLAY_COMMIT_LABELS,
} from './x-article-insert-menu.mjs';

test('OVERLAY_COMMIT_LABELS includes Update before Insert for table edit', () => {
  assert.deepEqual(OVERLAY_COMMIT_LABELS, ['Update', 'Insert', 'Apply']);
  assert.equal(OVERLAY_COMMIT_LABELS[0], 'Update');
  assert.ok(OVERLAY_COMMIT_LABELS.includes('Insert'));
});

test('code overlay constants match live X picker (2026-08-30)', () => {
  assert.equal(CODE_LANGUAGE_INPUT_TESTID, 'programming-language-input');
  assert.equal(CODE_LANGUAGE_SEARCH_LABEL, 'Search programming language');
  assert.equal(CODE_BODY_PLACEHOLDER, 'Add code here');
});

test('Job1 insertPlan has sql + text fences with MARKDOWN payloads', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  const codes = payload.insertPlan.filter((e) => e.kind === 'code');
  assert.ok(codes.length >= 2);
  const select = codes.find((e) => /SELECT o\.id/.test(e.text));
  const error = codes.find((e) => /ERROR: column/.test(e.text));
  assert.ok(select);
  assert.ok(error);
  assert.equal(select.language, 'SQL');
  assert.equal(error.language, 'SQL');
  assert.match(select.markdown, /^```sql\n[\s\S]+\n```$/);
  assert.match(error.markdown, /^```sql\n[\s\S]+\n```$/);
});
