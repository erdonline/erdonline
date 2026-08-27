/**
 * 运行：cd frontend && npx tsx src/utils/mcpJsonSnippet.test.ts
 */
import assert from 'node:assert/strict';
import {
  LOCAL_MCP_API_URL,
  MCP_NPX_ARGS,
  MCP_NPX_PACKAGE,
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
