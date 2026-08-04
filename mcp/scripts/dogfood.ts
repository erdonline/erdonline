#!/usr/bin/env tsx
/**
 * Dogfood: mint PAT against local 9502 → REST via ErdApiClient → MCP tools/list + tools/call over stdio.
 * Usage: cd mcp && yarn dogfood
 * Optional env: ERD_API_URL, ERD_DOGFOOD_USER, ERD_DOGFOOD_PASSWORD
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ErdApiClient } from '../src/erd-api.js';

const API = (process.env.ERD_API_URL ?? 'http://127.0.0.1:9502').replace(
  /\/+$/,
  '',
);
const USER = process.env.ERD_DOGFOOD_USER ?? 'admin';
const PASS = process.env.ERD_DOGFOOD_PASSWORD ?? '123456';

async function loginJwt(): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USER, password: PASS }),
  });
  const json = (await res.json()) as Record<string, unknown>;
  const token =
    (json.access_token as string | undefined) ??
    ((json.data as Record<string, unknown> | undefined)?.access_token as
      | string
      | undefined);
  if (!token) {
    throw new Error(`Login failed: ${JSON.stringify(json).slice(0, 300)}`);
  }
  return token;
}

async function mintPat(jwt: string): Promise<string> {
  const res = await fetch(`${API}/auth/personal-access-tokens`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: `mcp-dogfood-${Date.now()}` }),
  });
  const json = (await res.json()) as {
    code?: number;
    data?: { token?: string };
    msg?: string;
  };
  const pat = json.data?.token;
  if (!pat?.startsWith('erd_pat_')) {
    throw new Error(`Mint PAT failed: ${JSON.stringify(json).slice(0, 300)}`);
  }
  return pat;
}

async function main() {
  console.error(`[dogfood] API=${API} user=${USER}`);
  const jwt = await loginJwt();
  const pat = await mintPat(jwt);
  console.error(`[dogfood] PAT minted …${pat.slice(-4)}`);

  const api = new ErdApiClient({ baseUrl: API, pat });
  const me = await api.me();
  console.error('[dogfood] REST /me ok', JSON.stringify(me).slice(0, 120));

  const projects = (await api.listProjects(1, 5)) as {
    items?: Array<{ id: string; name?: string }>;
  };
  const firstId = projects?.items?.[0]?.id;
  console.error(
    `[dogfood] REST list_projects items=${projects?.items?.length ?? 0}`,
  );

  if (firstId) {
    const detail = (await api.getProject(firstId)) as {
      projectJSON?: { profile?: { dbs?: unknown[] } };
    };
    const dbs = detail?.projectJSON?.profile?.dbs;
    if (Array.isArray(dbs) && dbs.length > 0) {
      throw new Error('secret leak: projectJSON.profile.dbs not empty');
    }
    console.error('[dogfood] REST get_project ok, profile.dbs=[]');

    const versions = (await api.listVersions(firstId, { page: 1, size: 5 })) as {
      items?: Array<{ id: string }>;
    };
    console.error(
      `[dogfood] REST list_versions items=${versions?.items?.length ?? 0}`,
    );
  }

  const here = path.dirname(fileURLToPath(import.meta.url));
  const entry = path.join(here, '../src/index.ts');
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['--yes', 'tsx', entry],
    env: {
      ...process.env,
      ERD_API_URL: API,
      ERD_PAT: pat,
    },
    stderr: 'pipe',
  });
  transport.stderr?.on('data', (chunk: Buffer) => {
    process.stderr.write(`[mcp] ${chunk.toString()}`);
  });

  const client = new Client({ name: 'erd-mcp-dogfood', version: '0.1.0' });
  await client.connect(transport);
  const tools = await client.listTools();
  const names = tools.tools.map((t) => t.name).sort();
  console.error('[dogfood] MCP tools:', names.join(', '));
  const expected = [
    'get_project',
    'get_project_schema',
    'get_version',
    'list_projects',
    'list_versions',
  ];
  for (const n of expected) {
    if (!names.includes(n)) {
      throw new Error(`missing tool ${n}`);
    }
  }
  if (names.some((n) => /write|create|post|delete|update/i.test(n))) {
    throw new Error(`unexpected write-ish tool: ${names.join(',')}`);
  }

  const listCall = await client.callTool({
    name: 'list_projects',
    arguments: { page: 1, size: 5 },
  });
  if (listCall.isError) {
    throw new Error(`list_projects tool error: ${JSON.stringify(listCall)}`);
  }
  console.error('[dogfood] MCP list_projects ok');

  if (firstId) {
    const schemaCall = await client.callTool({
      name: 'get_project_schema',
      arguments: { projectId: firstId },
    });
    if (schemaCall.isError) {
      throw new Error(
        `get_project_schema tool error: ${JSON.stringify(schemaCall)}`,
      );
    }
    console.error('[dogfood] MCP get_project_schema ok');
  }

  await client.close();
  console.error('[dogfood] PASS');
}

main().catch((e) => {
  console.error('[dogfood] FAIL', e);
  process.exit(1);
});
