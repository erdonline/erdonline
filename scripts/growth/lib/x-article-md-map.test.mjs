/**
 * MD → IR middle layer tests — no Chrome.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { compileArticle } from './x-article-compile.mjs';
import { buildBlocks, countBlocksByKind } from './x-article-block-ir.mjs';
import {
  countMarkdownFences,
  countMarkdownH2,
  parseMarkdownToBlocks,
  readPackBodyMarkdown,
} from './x-article-md-map.mjs';
import { resolvePack } from './x-article-packs.mjs';

test('Job1 MD body has sql fences and ## headings', () => {
  const pack = resolvePack('dont-give-agent-prod-db');
  const md = readPackBodyMarkdown(pack);
  assert.ok(countMarkdownFences(md) >= 2, 'at least SELECT + ERROR fences');
  assert.match(md, /```sql\nSELECT o\.id/);
  assert.equal(countMarkdownH2(md), 7);
});

test('parseMarkdownToBlocks: fence → code IR, not body', () => {
  const blocks = parseMarkdownToBlocks(
    'Intro paragraph.\n\n```sql\nSELECT 1;\n```\n\nAfter.',
  );
  const code = blocks.find((b) => b.kind === 'code');
  assert.ok(code);
  assert.match(code.text, /SELECT 1/);
  assert.equal(code.language, 'SQL');
  assert.match(code.markdown, /^```sql\n/);
  assert.ok(!blocks.some((b) => b.kind === 'body' && b.text.includes('SELECT 1')));
});

test('parseMarkdownToBlocks: markdown table → table IR', () => {
  const blocks = parseMarkdownToBlocks(
    '| a | b |\n|---|---|\n| 1 | 2 |',
  );
  assert.equal(blocks[0].kind, 'table');
  assert.deepEqual(blocks[0].rows, [['a', 'b'], ['1', '2']]);
});

test('parseMarkdownToBlocks: ## → subheading', () => {
  const blocks = parseMarkdownToBlocks('## SECTION ONE\n\nBody.');
  assert.equal(blocks[0].kind, 'subheading');
  assert.equal(blocks[0].text, 'SECTION ONE');
});

test('parseMarkdownToBlocks: **bold** and [link](url)', () => {
  const blocks = parseMarkdownToBlocks('Hello **world** at [demo](https://example.com/demo).');
  assert.equal(blocks[0].kind, 'body');
  assert.deepEqual(blocks[0].markPhrases, ['world']);
  assert.deepEqual(blocks[0].links, [{ label: 'demo', url: 'https://example.com/demo' }]);
});

test('Job1 compile: h2 count matches MD ## count', () => {
  const pack = resolvePack('dont-give-agent-prod-db');
  const md = readPackBodyMarkdown(pack);
  const payload = compileArticle('dont-give-agent-prod-db');
  assert.equal(payload.meta.h2Texts.length, countMarkdownH2(md));
  assert.equal(payload.meta.h2Texts.length, 7);
});

test('Job1 compile: ≥2 code insertPlan; SELECT not in html <p>', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  const codes = payload.insertPlan.filter((e) => e.kind === 'code');
  assert.ok(codes.length >= 2);
  const selectEntry = codes.find((e) => /SELECT o\.id/.test(e.text));
  assert.ok(selectEntry, 'SELECT in code insertPlan');
  assert.equal(selectEntry.language, 'SQL');
  assert.match(selectEntry.markdown, /^```sql\n/);
  assert.ok(!payload.html.includes('<p>SELECT o.id'), 'SELECT must not be pasted as paragraph');
  const errorEntry = codes.find((e) => /ERROR: column/.test(e.text));
  assert.ok(errorEntry);
  assert.equal(errorEntry.language, 'SQL');
  assert.match(errorEntry.markdown, /^```sql\n/);
});

test('Job1 compile: table from MD markdown table', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  const table = payload.insertPlan.find((e) => e.kind === 'table');
  assert.ok(table);
  assert.equal(table.rows.length, 3);
  assert.equal(table.rows[0][1], 'Live catalog MCP');
});

test('Job1 IR: 3 code fences (sql + text + json) + 1 table', () => {
  const blocks = buildBlocks('dont-give-agent-prod-db');
  const counts = countBlocksByKind(blocks);
  assert.equal(counts.code, 3);
  assert.equal(counts.table, 1);
});
