#!/usr/bin/env tsx
/**
 * Dogfood: mint PAT (incl. write scopes) → REST create_version → MCP tools.
 * Usage: cd mcp && yarn dogfood
 * Optional env: ERD_API_URL, ERD_DOGFOOD_USER, ERD_DOGFOOD_PASSWORD
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ErdApiClient, ErdApiError } from '../src/erd-api.js';

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

async function mintPat(jwt: string, scopes?: string[]): Promise<string> {
  const res = await fetch(`${API}/auth/personal-access-tokens`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: `mcp-dogfood-${Date.now()}`,
      scopes,
    }),
  });
  const json = (await res.json()) as {
    code?: number;
    data?: { token?: string; scopes?: string[] };
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

  const readPat = await mintPat(jwt);
  console.error(`[dogfood] read PAT minted …${readPat.slice(-4)}`);

  const writePat = await mintPat(jwt, [
    'projects:read',
    'versions:read',
    'versions:write',
  ]);
  console.error(`[dogfood] write PAT minted …${writePat.slice(-4)}`);

  const api = new ErdApiClient({ baseUrl: API, pat: writePat });
  const me = (await api.me()) as { scopes?: string[] };
  if (!me?.scopes?.includes('versions:write')) {
    throw new Error(`expected versions:write on me: ${JSON.stringify(me)}`);
  }
  console.error('[dogfood] REST /me ok scopes=', me.scopes?.join(','));

  const projects = (await api.listProjects(1, 5)) as {
    items?: Array<{ id: string; name?: string }>;
  };
  const firstId = projects?.items?.[0]?.id;
  console.error(
    `[dogfood] REST list_projects items=${projects?.items?.length ?? 0}`,
  );

  if (firstId) {
    const detail = (await api.getProject(firstId)) as {
      projectJSON?: Record<string, unknown> & {
        profile?: { dbs?: unknown[] };
      };
      projectJson?: Record<string, unknown> & {
        profile?: { dbs?: unknown[] };
      };
    };
    const projectJSON = detail.projectJSON ?? detail.projectJson;
    const dbs = projectJSON?.profile?.dbs;
    if (Array.isArray(dbs) && dbs.length > 0) {
      throw new Error('secret leak: projectJSON.profile.dbs not empty');
    }
    console.error('[dogfood] REST get_project ok, profile.dbs=[]');

    const verLabel = `df${String(Date.now()).slice(-10)}`;
    const snapshot = {
      ...(projectJSON ?? { modules: [] }),
      profile: {
        ...((projectJSON?.profile as Record<string, unknown>) ?? {}),
        dbs: [{ url: 'jdbc:should-be-stripped' }],
      },
    };
    const created = (await api.createVersion(firstId, {
      dbKey: 'defaultDB',
      version: verLabel,
      versionDesc: 'mcp dogfood write slice',
      projectJSON: snapshot,
      tag: 'dogfood',
    })) as {
      id?: string;
      version?: string;
      projectJSON?: { profile?: { dbs?: unknown[] } };
      projectJson?: { profile?: { dbs?: unknown[] } };
    };
    if (!created?.id || created.version !== verLabel) {
      throw new Error(`create_version bad: ${JSON.stringify(created).slice(0, 300)}`);
    }
    const outDbs =
      (created.projectJSON ?? created.projectJson)?.profile?.dbs;
    if (Array.isArray(outDbs) && outDbs.length > 0) {
      throw new Error('create_version response leaked profile.dbs');
    }
    console.error(`[dogfood] REST create_version ok id=${created.id}`);

    const readOnly = new ErdApiClient({ baseUrl: API, pat: readPat });
    try {
      await readOnly.createVersion(firstId, {
        dbKey: 'defaultDB',
        version: `${verLabel}-denied`,
        versionDesc: 'should 403',
        projectJSON: { modules: [] },
      });
      throw new Error('read-only PAT should not create_version');
    } catch (e) {
      if (!(e instanceof ErdApiError) || (e.status !== 403 && e.status !== 401)) {
        throw e;
      }
      console.error('[dogfood] REST create_version denied without write scope ok');
    }
  } else {
    console.error('[dogfood] skip write probe (no projects)');
  }

  const here = path.dirname(fileURLToPath(import.meta.url));
  const entry = path.join(here, '../src/index.ts');
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['--yes', 'tsx', entry],
    env: {
      ...process.env,
      ERD_API_URL: API,
      ERD_PAT: writePat,
    },
    stderr: 'pipe',
  });
  transport.stderr?.on('data', (chunk: Buffer) => {
    process.stderr.write(`[mcp] ${chunk.toString()}`);
  });

  const client = new Client({ name: 'erd-mcp-dogfood', version: '0.2.0' });
  await client.connect(transport);
  const tools = await client.listTools();
  const names = tools.tools.map((t) => t.name).sort();
  console.error('[dogfood] MCP tools:', names.join(', '));
  const expected = [
    'create_version',
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

    const mcpVer = `mt${String(Date.now()).slice(-10)}`;
    const createCall = await client.callTool({
      name: 'create_version',
      arguments: {
        projectId: firstId,
        dbKey: 'defaultDB',
        version: mcpVer,
        versionDesc: 'mcp create_version tool',
        projectJSON: { modules: [], profile: { dbs: [] } },
        tag: 'mcp-df',
      },
    });
    if (createCall.isError) {
      throw new Error(`create_version tool error: ${JSON.stringify(createCall)}`);
    }
    console.error('[dogfood] MCP create_version ok');
  }

  await client.close();
  console.error('[dogfood] PASS');
}

main().catch((e) => {
  console.error('[dogfood] FAIL', e);
  process.exit(1);
});
