/**
 * 运行：cd frontend && npx tsx src/utils/apiHref.test.ts
 */
import assert from 'node:assert/strict';
import {buildApiHrefWithBase} from './apiHref';

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`, e);
    process.exitCode = 1;
  }
}

run('empty base keeps relative path', () => {
  assert.equal(
    buildApiHrefWithBase('/auth/federate/github', ''),
    '/auth/federate/github',
  );
});

run('strips trailing slash from base', () => {
  assert.equal(
    buildApiHrefWithBase('/auth/federate/google?redirect=%2Fhome', 'https://api.example.com/'),
    'https://api.example.com/auth/federate/google?redirect=%2Fhome',
  );
});

run('preserves query on absolute URL', () => {
  assert.equal(
    buildApiHrefWithBase('/auth/federate/wechat?redirect=%2Fdemo', 'https://railway.app'),
    'https://railway.app/auth/federate/wechat?redirect=%2Fdemo',
  );
});

run('rejects path without leading slash', () => {
  assert.throws(
    () => buildApiHrefWithBase('auth/federate/github', 'https://api.example.com'),
    /must start with \//,
  );
});
