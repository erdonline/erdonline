#!/usr/bin/env node
/**
 * Hermetic unit checks for Streamable HTTP PAT extraction and the Public API
 * client. No backend or database is contacted.
 */
import assert from 'node:assert/strict';
import {
  ErdApiClient,
  patFromAuthorizationHeader,
} from '../dist/erd-api.js';

const tests = [];

function test(name, run) {
  tests.push({name, run});
}

test('extracts only a usable ERD PAT from Bearer authorization', () => {
  assert.equal(
    patFromAuthorizationHeader('Bearer erd_pat_request_scoped'),
    'erd_pat_request_scoped',
  );
  assert.equal(patFromAuthorizationHeader('Bearer jwt.not.accepted'), undefined);
  assert.equal(patFromAuthorizationHeader('Basic erd_pat_wrong_scheme'), undefined);
  assert.equal(patFromAuthorizationHeader('Bearer erd_pat_…'), undefined);
  assert.equal(patFromAuthorizationHeader(undefined), undefined);
});

test('forwards PAT to Public API without a live database', async () => {
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (url, init) => {
    captured = {url: String(url), init};
    return new Response(
      JSON.stringify({code: 200, data: {items: [], total: 0}}),
      {status: 200, headers: {'Content-Type': 'application/json'}},
    );
  };

  try {
    const client = new ErdApiClient({
      baseUrl: 'https://unit.invalid',
      pat: 'erd_pat_request_scoped',
    });
    const result = await client.listProjects(2, 7);

    assert.deepEqual(result, {items: [], total: 0});
    assert.equal(
      captured.url,
      'https://unit.invalid/api/v1/projects?page=2&size=7',
    );
    assert.equal(captured.init.method, 'GET');
    assert.equal(
      captured.init.headers.Authorization,
      'Bearer erd_pat_request_scoped',
    );
    assert.equal(captured.init.headers.Accept, 'application/json');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

for (const {name, run} of tests) {
  await run();
  console.log(`OK ${name}`);
}
console.log(`PASS ${tests.length} tests`);
