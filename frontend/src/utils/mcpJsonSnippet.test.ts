/**
 * 运行：cd frontend && npx tsx src/utils/mcpJsonSnippet.test.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  LOCAL_MCP_API_URL,
  MCP_NPX_ARGS,
  MCP_NPX_PACKAGE,
  MCP_PAT_PLACEHOLDER,
  PRODUCTION_MCP_API_URL,
  buildCursorMcpJson,
  cursorMcpInstallConfig,
  cursorMcpInstallDeeplink,
  resolveMcpApiUrl,
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

run('empty or relative API URL becomes local MCP host', () => {
  assert.equal(resolveMcpApiUrl(''), LOCAL_MCP_API_URL);
  assert.equal(resolveMcpApiUrl('   '), LOCAL_MCP_API_URL);
  assert.equal(resolveMcpApiUrl('/'), LOCAL_MCP_API_URL);
  assert.equal(resolveMcpApiUrl(undefined), LOCAL_MCP_API_URL);
});

run('strips trailing slash from absolute API URL', () => {
  assert.equal(
    resolveMcpApiUrl('https://erdonline-production.up.railway.app/'),
    'https://erdonline-production.up.railway.app',
  );
});

run('snippet fills PAT and uses npx tarball (no local clone path)', () => {
  const json = buildCursorMcpJson(
    'erd_pat_secret',
    'https://erdonline-production.up.railway.app/',
  );
  const parsed = JSON.parse(json) as {
    mcpServers: {
      erdonline: {command: string; args: string[]; env: Record<string, string>};
    };
  };
  assert.equal(
    parsed.mcpServers.erdonline.env.ERD_PAT,
    'erd_pat_secret',
  );
  assert.equal(
    parsed.mcpServers.erdonline.env.ERD_API_URL,
    'https://erdonline-production.up.railway.app',
  );
  assert.equal(parsed.mcpServers.erdonline.command, 'npx');
  assert.deepEqual(parsed.mcpServers.erdonline.args, [...MCP_NPX_ARGS]);
  assert.match(MCP_NPX_PACKAGE, /erdonline-mcp-0\.1\.0\.tgz$/);
  assert.equal(MCP_NPX_ARGS[1], '--package');
  assert.equal(MCP_NPX_ARGS[3], 'erd-mcp');
  assert.doesNotMatch(json, /ABS\/PATH/);
  assert.match(json, /"mcpServers"/);
});

run('dev empty API_URL uses 127.0.0.1:9502', () => {
  const json = buildCursorMcpJson('erd_pat_dev', '');
  const parsed = JSON.parse(json) as {
    mcpServers: {erdonline: {env: Record<string, string>}};
  };
  assert.equal(parsed.mcpServers.erdonline.env.ERD_API_URL, LOCAL_MCP_API_URL);
});

run('Cursor install-link config is shipped npx tarball + PAT placeholder', () => {
  const cfg = cursorMcpInstallConfig();
  assert.equal(cfg.command, 'npx');
  assert.deepEqual(cfg.args, [...MCP_NPX_ARGS]);
  assert.equal(cfg.env.ERD_API_URL, PRODUCTION_MCP_API_URL);
  assert.equal(cfg.env.ERD_PAT, MCP_PAT_PLACEHOLDER);
  const href = cursorMcpInstallDeeplink();
  assert.match(href, /^cursor:\/\/anysphere\.cursor-deeplink\/mcp\/install\?name=erdonline&config=/);
  const u = new URL(href.replace(/^cursor:/, 'http:'));
  const q = u.searchParams.get('config');
  assert.ok(q);
  const decoded = JSON.parse(
    Buffer.from(q, 'base64').toString('utf8'),
  ) as {command: string; args: string[]};
  assert.deepEqual(decoded.args, [...MCP_NPX_ARGS]);
});

run('install-link href never contains a minted PAT secret', () => {
  const secret = 'erd_pat_minted_secret';
  const json = buildCursorMcpJson(secret, PRODUCTION_MCP_API_URL);
  assert.match(json, new RegExp(secret));
  const href = cursorMcpInstallDeeplink();
  assert.ok(!href.includes(secret));
  assert.ok(!decodeURIComponent(href).includes(secret));
  const u = new URL(href.replace(/^cursor:/, 'http:'));
  const q = u.searchParams.get('config');
  assert.ok(q);
  const raw = Buffer.from(q, 'base64').toString('utf8');
  assert.ok(!raw.includes(secret));
  const decoded = JSON.parse(raw) as {env: {ERD_PAT: string}};
  assert.equal(decoded.env.ERD_PAT, MCP_PAT_PLACEHOLDER);
  assert.ok(!decoded.env.ERD_PAT.startsWith('erd_pat_m'));
});

run('README and MCP guide contain the Cursor install deeplink', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const href = cursorMcpInstallDeeplink();
  for (const rel of [
    'README.md',
    'README.en-US.md',
    'docs/guide/api-and-mcp.md',
    'website/i18n/en/docusaurus-plugin-content-docs/current/guide/api-and-mcp.md',
  ]) {
    const text = fs.readFileSync(path.join(root, rel), 'utf8');
    assert.ok(text.includes(href), `${rel} missing Cursor install deeplink`);
  }
});
