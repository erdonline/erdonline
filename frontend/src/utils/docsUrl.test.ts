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
  const expected = 'https://erdonline.github.io/erdonline/';
  if (actual !== expected) throw new Error(actual);
});

run('en-US uses the English docs locale', () => {
  const actual = docsUrl('en-US');
  const expected = 'https://erdonline.github.io/erdonline/en/';
  if (actual !== expected) throw new Error(actual);
});

run('path joins without duplicate slashes', () => {
  const actual = docsUrl('en-US', '/docs/roadmap');
  const expected = 'https://erdonline.github.io/erdonline/en/docs/roadmap';
  if (actual !== expected) throw new Error(actual);
});
