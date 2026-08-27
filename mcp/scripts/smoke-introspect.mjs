#!/usr/bin/env node
/**
 * Glama-style stdio handshake: initialize + tools/list with NO ERD_PAT.
 *   cd mcp && yarn smoke:introspect
 */
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  attachEmptyProjectsHint,
  EMPTY_PROJECTS_HINT,
} from '../dist/erd-api.js';

const mcpRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const READY = 'erd-mcp stdio ready';

function rpc(id, method, params) {
  return JSON.stringify({jsonrpc: '2.0', id, method, params}) + '\n';
}

const env = {...process.env};
delete env.ERD_PAT;
delete env.ERD_API_TOKEN;
env.ERD_API_URL = env.ERD_API_URL || 'https://erdonline-production.up.railway.app';

const child = spawn(process.execPath, ['dist/index.js'], {
  cwd: mcpRoot,
  env,
  stdio: ['pipe', 'pipe', 'pipe'],
});

let stdout = '';
let stderr = '';
const messages = [];

child.stdout.on('data', (chunk) => {
  stdout += chunk.toString();
  for (;;) {
    const nl = stdout.indexOf('\n');
    if (nl === -1) break;
    const line = stdout.slice(0, nl).replace(/\r$/, '');
    stdout = stdout.slice(nl + 1);
    if (!line) continue;
    try {
      messages.push(JSON.parse(line));
    } catch {
      /* ignore non-json */
    }
  }
});
child.stderr.on('data', (c) => {
  stderr += c.toString();
});

const timer = setTimeout(() => {
  child.kill('SIGKILL');
}, 20_000);

await new Promise((resolve, reject) => {
  const waitReady = setInterval(() => {
    if (stderr.includes(READY)) {
      clearInterval(waitReady);
      resolve();
    }
  }, 50);
  child.on('error', reject);
  child.on('exit', (code) => {
    if (!stderr.includes(READY)) {
      clearInterval(waitReady);
      reject(new Error(`exited ${code}: ${stderr}`));
    }
  });
});

child.stdin.write(
  rpc(1, 'initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {name: 'erd-mcp-introspect', version: '0.1.0'},
  }),
);

const init = await waitFor((m) => m.id === 1, 8000);
if (init.error) {
  fail(`initialize error ${JSON.stringify(init.error)}`);
}
child.stdin.write(JSON.stringify({jsonrpc: '2.0', method: 'notifications/initialized'}) + '\n');
child.stdin.write(rpc(2, 'tools/list', {}));
const listed = await waitFor((m) => m.id === 2, 8000);
child.stdin.write(rpc(3, 'resources/list', {}));
const resources = await waitFor((m) => m.id === 3, 8000);
child.stdin.write(rpc(4, 'prompts/list', {}));
const prompts = await waitFor((m) => m.id === 4, 8000);
child.stdin.write(
  rpc(5, 'resources/read', {
    uri: 'https://doc.erdonline.com/docs/guide/api-and-mcp/',
  }),
);
const guide = await waitFor((m) => m.id === 5, 8000);
child.stdin.write(
  rpc(6, 'tools/call', {name: 'list_projects', arguments: {}}),
);
const called = await waitFor((m) => m.id === 6, 8000);
clearTimeout(timer);
child.kill('SIGTERM');

const names = (listed.result?.tools ?? []).map((t) => t.name);
if (!names.includes('list_projects') || !names.includes('get_project_schema')) {
  fail(`tools/list missing schema tools: ${names.join(',')}`);
}
const byName = Object.fromEntries(
  (listed.result?.tools ?? []).map((t) => [t.name, t]),
);
if (byName.list_projects?.annotations?.readOnlyHint !== true) {
  fail('list_projects must set annotations.readOnlyHint');
}
if (byName.put_project_json?.annotations?.destructiveHint !== true) {
  fail('put_project_json must set annotations.destructiveHint');
}
if (byName.create_version?.annotations?.readOnlyHint !== false) {
  fail('create_version must set annotations.readOnlyHint=false');
}
const resourceUris = (resources.result?.resources ?? []).map((r) => r.uri);
if (!resourceUris.some((u) => String(u).includes('doc.erdonline.com/docs/guide/api-and-mcp'))) {
  fail(`resources/list missing MCP guide: ${JSON.stringify(resources)}`);
}
const promptNames = (prompts.result?.prompts ?? []).map((p) => p.name);
if (!promptNames.includes('list-erd-projects')) {
  fail(`prompts/list missing list-erd-projects: ${JSON.stringify(prompts)}`);
}
const guideText = guide.result?.contents?.[0]?.text ?? '';
if (!guideText.includes('projectJSON') || !guideText.includes('30 秒接到 Cursor')) {
  fail(`resources/read must serve api-and-mcp markdown: ${guideText.slice(0, 200)}`);
}
if (called.result?.isError !== true) {
  fail(`tools/call without PAT must be isError: ${JSON.stringify(called)}`);
}
const callText = called.result?.content?.[0]?.text ?? '';
if (!callText.includes('ERD_PAT') || !callText.includes('doc.erdonline.com/docs/guide/api-and-mcp')) {
  fail(`missing-PAT tool error must name ERD_PAT and the guide URL: ${callText}`);
}
if (callText.includes('erd_pat_m') || /erd_pat_[a-z0-9]{8,}/i.test(callText)) {
  fail(`tool error leaked a PAT-shaped secret: ${callText}`);
}
const hinted = attachEmptyProjectsHint({items: [], total: 0});
if (
  !hinted ||
  typeof hinted !== 'object' ||
  hinted.hint !== EMPTY_PROJECTS_HINT ||
  !String(hinted.hint).includes('Demo')
) {
  fail(`empty list must attach designer/Demo hint: ${JSON.stringify(hinted)}`);
}
const occupied = attachEmptyProjectsHint({items: [{id: 'p1'}], total: 1});
if (occupied && typeof occupied === 'object' && 'hint' in occupied) {
  fail('non-empty list must not attach hint');
}
if (stderr.includes('Missing ERD_PAT') && !stderr.includes('stdio ready')) {
  fail('boot still requires PAT');
}
console.log(
  'INTROSPECT OK',
  names.length,
  'tools;',
  resourceUris.length,
  'resources;',
  promptNames.length,
  'prompts',
);
process.exit(0);

function waitFor(pred, ms) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const t = setInterval(() => {
      const hit = messages.find(pred);
      if (hit) {
        clearInterval(t);
        resolve(hit);
      } else if (Date.now() - start > ms) {
        clearInterval(t);
        reject(new Error(`timeout; stderr=${stderr} msgs=${JSON.stringify(messages)}`));
      }
    }, 30);
  });
}

function fail(msg) {
  console.error(stderr);
  console.error(msg);
  process.exit(1);
}
