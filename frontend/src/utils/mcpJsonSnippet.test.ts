/**
 * 运行：cd frontend && npx tsx src/utils/mcpJsonSnippet.test.ts
 */
import assert from 'node:assert/strict';
import {
  LOCAL_MCP_API_URL,
  MCP_DIST_PATH_PLACEHOLDER,
  buildCursorMcpJson,
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

run('snippet fills PAT and keeps path placeholder', () => {
  const json = buildCursorMcpJson(
    'erd_pat_secret',
    'https://erdonline-production.up.railway.app/',
  );
  const parsed = JSON.parse(json) as {
    mcpServers: {erdonline: {args: string[]; env: Record<string, string>}};
  };
  assert.equal(
    parsed.mcpServers.erdonline.env.ERD_PAT,
    'erd_pat_secret',
  );
  assert.equal(
    parsed.mcpServers.erdonline.env.ERD_API_URL,
    'https://erdonline-production.up.railway.app',
  );
  assert.equal(parsed.mcpServers.erdonline.args[0], MCP_DIST_PATH_PLACEHOLDER);
  assert.match(json, /"mcpServers"/);
});

run('dev empty API_URL uses 127.0.0.1:9502', () => {
  const json = buildCursorMcpJson('erd_pat_dev', '');
  const parsed = JSON.parse(json) as {
    mcpServers: {erdonline: {env: Record<string, string>}};
  };
  assert.equal(parsed.mcpServers.erdonline.env.ERD_API_URL, LOCAL_MCP_API_URL);
});
