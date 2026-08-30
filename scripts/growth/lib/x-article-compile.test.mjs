/**
 * Compile tests — no Chrome required.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildBlocks,
  countBlocksByKind,
  getInsertBlockIndices,
  INSERT_KINDS,
} from './x-article-block-ir.mjs';
import { compileArticle, compileBlocks } from './x-article-compile.mjs';
import { countMarkdownH2, readPackBodyMarkdown } from './x-article-md-map.mjs';
import { resolvePack } from './x-article-packs.mjs';

test('Job1 IR has sparse inserts (3 code + table, not consecutive)', () => {
  const blocks = buildBlocks('dont-give-agent-prod-db');
  const counts = countBlocksByKind(blocks);
  assert.equal(counts.code, 3);
  assert.equal(counts.table, 1);
  const indices = getInsertBlockIndices(blocks);
  assert.equal(indices.length, 4);
  for (let i = 1; i < indices.length; i++) {
    assert.ok(indices[i] - indices[i - 1] > 1, 'insert blocks separated by body blocks');
  }
});

test('INSERT_KINDS includes code and table', () => {
  assert.ok(INSERT_KINDS.has('code'));
  assert.ok(INSERT_KINDS.has('table'));
  assert.ok(!INSERT_KINDS.has('body'));
});

test('Job1 compile HTML h2 count matches MD ## count', () => {
  const pack = resolvePack('dont-give-agent-prod-db');
  const md = readPackBodyMarkdown(pack);
  const payload = compileArticle('dont-give-agent-prod-db');
  const h2Count = (payload.html.match(/<h2>/g) || []).length;
  assert.equal(h2Count, countMarkdownH2(md));
  assert.equal(h2Count, 7);
});

test('Job1 compile: title, hook HTML, insertPlan 3 code + table', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  assert.equal(payload.title, "Don't give your agent the production database");
  assert.ok(payload.html.includes('Friday night'), 'html contains Friday hook');
  assert.ok(payload.html.includes('<h2>'), 'html contains subheading tags');
  assert.ok(payload.html.includes('<strong>'), 'bold via HTML strong');
  assert.ok(payload.html.includes('<strong>invented column</strong>'), 'invented column bold in HTML');
  assert.ok(payload.meta.markPhrases?.includes('invented column'));
  assert.ok(payload.plain.includes('Friday night'));
  assert.equal(payload.insertPlan.length, 4);
  const codeEntries = payload.insertPlan.filter((e) => e.kind === 'code');
  assert.equal(codeEntries.length, 3);
  assert.match(codeEntries[0].text, /SELECT o\.id/);
  assert.equal(codeEntries[0].language, 'SQL');
  assert.match(codeEntries[0].markdown, /^```sql\n/);
  assert.equal(codeEntries[0].anchor.type, 'afterText');
  assert.ok(codeEntries[0].anchor.text.startsWith('Friday night'));
  assert.match(codeEntries[1].text, /ERROR: column/);
  assert.match(codeEntries[1].text, /LINE 2:/);
  assert.equal(codeEntries[1].language, 'SQL');
  assert.match(codeEntries[1].markdown, /^```sql\n/);
  assert.equal(codeEntries[1].anchor.type, 'afterText');
  assert.ok(codeEntries[1].anchor.text.startsWith('Paste it into your client'));
  assert.match(codeEntries[2].text, /"found": false/);
  assert.equal(codeEntries[2].language, 'JSON');
  const tableEntry = payload.insertPlan.find((e) => e.kind === 'table');
  assert.ok(tableEntry);
  assert.equal(tableEntry.rows.length, 3);
  assert.equal(tableEntry.anchor.type, 'afterText');
});

test('Job1 compile payload is stable (snapshot key fields)', () => {
  const a = compileArticle('dont-give-agent-prod-db');
  const b = compileArticle('dont-give-agent-prod-db');
  assert.equal(a.title, b.title);
  assert.equal(a.html, b.html);
  assert.equal(a.plain, b.plain);
  assert.deepEqual(
    a.insertPlan.map((e) => ({
      kind: e.kind,
      irIndex: e.irIndex,
      playOrder: e.playOrder,
      anchor: e.anchor,
      language: e.language,
      fenceTag: e.fenceTag,
    })),
    b.insertPlan.map((e) => ({
      kind: e.kind,
      irIndex: e.irIndex,
      playOrder: e.playOrder,
      anchor: e.anchor,
      language: e.language,
      fenceTag: e.fenceTag,
    })),
  );
  assert.equal(a.meta.textBlockCount, b.meta.textBlockCount);
  assert.equal(a.meta.h2Texts.length, 7);
});

test('Job1 playOrder ascending by irIndex', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  const orders = payload.insertPlan.map((e) => e.playOrder);
  assert.deepEqual(orders, [0, 1, 2, 3]);
  const kinds = [...payload.insertPlan].sort((a, b) => a.playOrder - b.playOrder).map((e) => e.kind);
  assert.deepEqual(kinds, ['code', 'code', 'table', 'code']);
});

test('playOrder assigned on every insertPlan entry', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  for (const entry of payload.insertPlan) {
    assert.equal(typeof entry.playOrder, 'number');
  }
  const orders = payload.insertPlan.map((e) => e.playOrder);
  assert.deepEqual(orders, [...orders].sort((x, y) => x - y));
});

test('trailing batch (≥2 inserts, no body between): playOrder is descending irIndex', () => {
  /** @type {import('./x-article-md-map.mjs').Block[]} */
  const blocks = [
    { kind: 'subheading', text: 'APPENDIX' },
    { kind: 'code', text: 'ERROR: trailing code', markdown: '```text\nERROR\n```' },
    { kind: 'table', rows: [['a', 'b'], ['1', '2']] },
  ];
  const payload = compileBlocks(blocks, 'Trailing batch');
  assert.equal(payload.insertPlan.length, 2);
  for (const entry of payload.insertPlan) {
    assert.equal(entry.anchor.type, 'trailing');
  }
  const byPlayOrder = [...payload.insertPlan].sort((a, b) => a.playOrder - b.playOrder);
  assert.ok(byPlayOrder[0].irIndex > byPlayOrder[1].irIndex, 'higher irIndex plays first');
  assert.deepEqual(
    byPlayOrder.map((e) => e.irIndex),
    [2, 1],
  );
});

test('postPasteActions are links only (no bold)', () => {
  const payload = compileArticle('dont-give-agent-prod-db');
  assert.ok(payload.postPasteActions.length >= 1);
  for (const action of payload.postPasteActions) {
    assert.equal(action.type, 'link');
    assert.ok(action.label);
    assert.ok(action.url);
  }
  assert.ok(!payload.postPasteActions.some((a) => a.type === 'bold'));
});

test('compileBlocks merges consecutive text into one HTML doc', () => {
  const blocks = buildBlocks('dont-give-agent-prod-db');
  const payload = compileBlocks(blocks, 'Test title');
  const pCount = (payload.html.match(/<p>/g) || []).length;
  assert.ok(pCount >= 20, `expected many paragraphs in one doc, got ${pCount}`);
  assert.ok(!payload.html.includes('markdown-code-block'), 'code stays out of HTML');
  assert.ok(!payload.html.includes('SELECT o.id'), 'fence SQL stays out of paste HTML');
});
