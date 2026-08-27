#!/usr/bin/env node
/**
 * Glama-style stdio handshake: initialize + tools/list with NO ERD_PAT.
 *   cd mcp && yarn smoke:introspect
 */
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

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
if (stderr.includes('Missing ERD_PAT') && !stderr.includes('stdio ready')) {
  fail('boot still requires PAT');
}
console.log('INTROSPECT OK', names.length, 'tools:', names.join(','));
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
