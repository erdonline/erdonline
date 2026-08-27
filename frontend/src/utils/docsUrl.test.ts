/**
 * 运行：cd frontend && npx tsx src/utils/docsUrl.test.ts
 */

import {docsUrl} from './docsUrl';

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`, e);
    process.exitCode = 1;
  }
}

run('zh-CN uses the default docs locale', () => {
  const actual = docsUrl('zh-CN');
  const expected = 'https://doc.erdonline.com/';
  if (actual !== expected) throw new Error(actual);
});

run('en-US uses the English docs locale', () => {
  const actual = docsUrl('en-US');
  const expected = 'https://doc.erdonline.com/en/';
  if (actual !== expected) throw new Error(actual);
});

run('path joins without duplicate slashes and ends with trailing slash', () => {
  const actual = docsUrl('en-US', '/docs/roadmap');
  const expected = 'https://doc.erdonline.com/en/docs/roadmap/';
  if (actual !== expected) throw new Error(actual);
});

run('already-slashed path is not doubled', () => {
  const actual = docsUrl('zh-CN', 'docs/guide/intro/');
  const expected = 'https://doc.erdonline.com/docs/guide/intro/';
  if (actual !== expected) throw new Error(actual);
});

run('MCP guide path is canonical with trailing slash', () => {
  const actual = docsUrl('zh-CN', 'docs/guide/api-and-mcp');
  const expected = 'https://doc.erdonline.com/docs/guide/api-and-mcp/';
  if (actual !== expected) throw new Error(actual);
});
