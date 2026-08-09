#!/usr/bin/env tsx
/**
 * Dogfood: mint PAT (incl. write scopes) → REST write → MCP tools.
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
const SNAPSHOT_DB_KEY = '__erd_snapshot__';

async function resolveVersionDbKey(
  jwt: string,
  projectJSON?: Record<string, unknown> & {
    profile?: { defaultDataSourceId?: string };
  },
): Promise<string> {
  const fromProfile = projectJSON?.profile?.defaultDataSourceId;
  if (fromProfile && String(fromProfile).trim()) {
    return String(fromProfile).trim();
  }
  const res = await fetch(`${API}/ncnb/dataSources?size=10&current=1`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const json = (await res.json()) as {
    data?: { records?: Array<{ id?: string }> };
  };
  const first = json?.data?.records?.[0]?.id;
  return first?.trim() || SNAPSHOT_DB_KEY;
}

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

function assertDenied(e: unknown, label: string): void {
  if (!(e instanceof ErdApiError) || (e.status !== 403 && e.status !== 401)) {
    throw e instanceof Error ? e : new Error(`${label}: ${String(e)}`);
  }
}

async function main() {
  console.error(`[dogfood] API=${API} user=${USER}`);
  const jwt = await loginJwt();

  const readPat = await mintPat(jwt);
  console.error(`[dogfood] read PAT minted …${readPat.slice(-4)}`);

  const writePat = await mintPat(jwt, [
    'projects:read',
    'projects:write',
    'versions:read',
    'versions:write',
  ]);
  console.error(`[dogfood] write PAT minted …${writePat.slice(-4)}`);

  const api = new ErdApiClient({ baseUrl: API, pat: writePat });
  const me = (await api.me()) as { scopes?: string[] };
  if (!me?.scopes?.includes('versions:write')) {
    throw new Error(`expected versions:write on me: ${JSON.stringify(me)}`);
  }
  if (!me?.scopes?.includes('projects:write')) {
    throw new Error(`expected projects:write on me: ${JSON.stringify(me)}`);
  }
  console.error('[dogfood] REST /me ok scopes=', me.scopes?.join(','));

  const projects = (await api.listProjects(1, 5)) as {
    items?: Array<{ id: string; name?: string }>;
  };
  const firstId = projects?.items?.[0]?.id;
  console.error(
    `[dogfood] REST list_projects items=${projects?.items?.length ?? 0}`,
  );

  let versionDbKey = SNAPSHOT_DB_KEY;

  if (firstId) {
    const detail = (await api.getProject(firstId)) as {
      name?: string;
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

    const patchName = `df-mcp-${String(Date.now()).slice(-8)}`;
    const patched = (await api.updateProject(firstId, {
      projectName: patchName,
    })) as { name?: string; projectName?: string; id?: string };
    const patchedName = patched?.projectName ?? patched?.name;
    if (patchedName !== patchName) {
      throw new Error(`update_project bad: ${JSON.stringify(patched).slice(0, 300)}`);
    }
    console.error(`[dogfood] REST update_project ok name=${patchName}`);

    const putBody = {
      ...(projectJSON ?? { modules: [] }),
      profile: {
        ...((projectJSON?.profile as Record<string, unknown>) ?? {}),
        dbs: [{ url: 'jdbc:should-be-stripped' }],
      },
    };
    const putResult = (await api.putProjectJson(firstId, putBody)) as {
      projectJSON?: { profile?: { dbs?: unknown[] } };
      projectJson?: { profile?: { dbs?: unknown[] } };
    };
    const putDbs =
      (putResult.projectJSON ?? putResult.projectJson)?.profile?.dbs;
    if (Array.isArray(putDbs) && putDbs.length > 0) {
      throw new Error('put_project_json response leaked profile.dbs');
    }
    console.error('[dogfood] REST put_project_json ok, profile.dbs=[]');

    const verLabel = `df${String(Date.now()).slice(-10)}`;
    const snapshot = {
      ...(projectJSON ?? { modules: [] }),
      profile: {
        ...((projectJSON?.profile as Record<string, unknown>) ?? {}),
        dbs: [{ url: 'jdbc:should-be-stripped' }],
      },
    };
    versionDbKey = await resolveVersionDbKey(jwt, projectJSON);
    console.error(`[dogfood] version dbKey=${versionDbKey}`);
    const created = (await api.createVersion(firstId, {
      dbKey: versionDbKey,
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
      assertDenied(e, 'create_version denied');
      console.error('[dogfood] REST create_version denied without write scope ok');
    }
    try {
      await readOnly.updateProject(firstId, { projectName: 'should-fail' });
      throw new Error('read-only PAT should not update_project');
    } catch (e) {
      assertDenied(e, 'update_project denied');
      console.error('[dogfood] REST update_project denied without projects:write ok');
    }
    try {
      await readOnly.putProjectJson(firstId, { modules: [] });
      throw new Error('read-only PAT should not put_project_json');
    } catch (e) {
      assertDenied(e, 'put_project_json denied');
      console.error('[dogfood] REST put_project_json denied without projects:write ok');
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

  const client = new Client({ name: 'erd-mcp-dogfood', version: '0.3.0' });
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
    'put_project_json',
    'update_project',
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

    const mcpName = `mcp-up-${String(Date.now()).slice(-8)}`;
    const updateCall = await client.callTool({
      name: 'update_project',
      arguments: { projectId: firstId, projectName: mcpName },
    });
    if (updateCall.isError) {
      throw new Error(`update_project tool error: ${JSON.stringify(updateCall)}`);
    }
    console.error('[dogfood] MCP update_project ok');

    const putCall = await client.callTool({
      name: 'put_project_json',
      arguments: {
        projectId: firstId,
        projectJSON: {
          modules: [],
          profile: { dbs: [{ url: 'jdbc:mcp-strip' }] },
        },
      },
    });
    if (putCall.isError) {
      throw new Error(`put_project_json tool error: ${JSON.stringify(putCall)}`);
    }
    console.error('[dogfood] MCP put_project_json ok');

    const mcpVer = `mt${String(Date.now()).slice(-10)}`;
    const createCall = await client.callTool({
      name: 'create_version',
      arguments: {
        projectId: firstId,
        dbKey: versionDbKey,
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
