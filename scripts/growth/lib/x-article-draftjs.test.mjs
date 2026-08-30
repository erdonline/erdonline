/**
 * Draft.js fence builder — no Chrome, no fiber mock.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMarkdownFence } from './x-article-draftjs.mjs';
import { compileArticle } from './x-article-compile.mjs';

test('buildMarkdownFence: SQL label → sql fence tag', () => {
  const fence = buildMarkdownFence('SQL', 'ERROR: column "last_login_at" does not exist.');
  assert.match(fence, /^```sql\n/);
  assert.match(fence, /ERROR: column "last_login_at" does not exist\./);
  assert.match(fence, /\n```$/);
});

test('Job1 compile code insertPlan matches sql markdown fence shape', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  const select = payload.insertPlan.find((e) => e.kind === 'code' && /SELECT o\.id/.test(e.text));
  assert.ok(select);
  assert.equal(select.language, 'SQL');
  assert.match(select.markdown, /^```sql\n/);
  assert.match(select.markdown, /SELECT o\.id/);
  assert.match(select.markdown, /\n```$/);
});
