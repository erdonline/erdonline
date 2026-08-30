/**
 * 运行：cd frontend && npx tsx src/utils/mcpJsonSnippet.test.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  LOCAL_MCP_URL,
  PRODUCTION_MCP_URL,
  buildCursorMcpJson,
  cursorMcpInstallConfig,
  cursorMcpInstallDeeplink,
  resolveMcpUrl,
} from './mcpJsonSnippet';

function run(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`, e);
    process.exitCode = 1;
  }
}

run('empty or relative API URL becomes local MCP endpoint', () => {
  assert.equal(resolveMcpUrl(''), LOCAL_MCP_URL);
  assert.equal(resolveMcpUrl('   '), LOCAL_MCP_URL);
  assert.equal(resolveMcpUrl('/'), LOCAL_MCP_URL);
  assert.equal(resolveMcpUrl(undefined), LOCAL_MCP_URL);
});

run('normalizes API roots to Streamable HTTP endpoint', () => {
  assert.equal(
    resolveMcpUrl('https://self-host.example.com/'),
    'https://self-host.example.com/mcp',
  );
  assert.equal(resolveMcpUrl('https://self-host.example.com/mcp'), 'https://self-host.example.com/mcp');
  assert.equal(resolveMcpUrl('https://erdonline-production.up.railway.app'), PRODUCTION_MCP_URL);
});

run('snippet fills PAT in remote HTTP headers', () => {
  const json = buildCursorMcpJson(
    'erd_pat_secret',
    'https://erdonline-production.up.railway.app/',
  );
  const parsed = JSON.parse(json) as {
    mcpServers: {
      erdonline: {url: string; headers: Record<string, string>};
    };
  };
  assert.equal(
    parsed.mcpServers.erdonline.headers.Authorization,
    'Bearer erd_pat_secret',
  );
  assert.equal(parsed.mcpServers.erdonline.url, PRODUCTION_MCP_URL);
  assert.doesNotMatch(json, /command|args|tgz|ERD_PAT|ERD_API_URL/);
  assert.match(json, /"mcpServers"/);
});

run('dev empty API_URL uses 127.0.0.1:9502', () => {
  const json = buildCursorMcpJson('erd_pat_dev', '');
  const parsed = JSON.parse(json) as {
    mcpServers: {erdonline: {url: string}};
  };
  assert.equal(parsed.mcpServers.erdonline.url, LOCAL_MCP_URL);
});

run('Cursor install-link config contains only canonical URL', () => {
  const cfg = cursorMcpInstallConfig();
  assert.deepEqual(cfg, {url: PRODUCTION_MCP_URL});
  const href = cursorMcpInstallDeeplink();
  assert.match(href, /^cursor:\/\/anysphere\.cursor-deeplink\/mcp\/install\?name=erdonline&config=/);
  const u = new URL(href.replace(/^cursor:/, 'http:'));
  const q = u.searchParams.get('config');
  assert.ok(q);
  const decoded = JSON.parse(
    Buffer.from(q, 'base64').toString('utf8'),
  ) as {url: string};
  assert.deepEqual(decoded, {url: PRODUCTION_MCP_URL});
});

run('install-link href never contains a minted PAT secret', () => {
  const secret = 'erd_pat_minted_secret';
  const json = buildCursorMcpJson(secret, PRODUCTION_MCP_URL);
  assert.match(json, new RegExp(secret));
  const href = cursorMcpInstallDeeplink();
  assert.ok(!href.includes(secret));
  assert.ok(!decodeURIComponent(href).includes(secret));
  const u = new URL(href.replace(/^cursor:/, 'http:'));
  const q = u.searchParams.get('config');
  assert.ok(q);
  const raw = Buffer.from(q, 'base64').toString('utf8');
  assert.ok(!raw.includes(secret));
  const decoded = JSON.parse(raw) as {url: string; headers?: unknown};
  assert.equal(decoded.url, PRODUCTION_MCP_URL);
  assert.equal(decoded.headers, undefined);
});

run('README and MCP guide link to the cursor-mcp bridge page', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const bridge = 'https://www.erdonline.com/cursor-mcp/';
  for (const rel of [
    'README.md',
    'README.en-US.md',
    'docs/guide/api-and-mcp.md',
    'website/i18n/en/docusaurus-plugin-content-docs/current/guide/api-and-mcp.md',
  ]) {
    const text = fs.readFileSync(path.join(root, rel), 'utf8');
    assert.ok(text.includes(bridge), `${rel} missing cursor-mcp bridge link`);
  }
});
