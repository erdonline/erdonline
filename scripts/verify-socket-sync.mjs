#!/usr/bin/env node
/**
 * 验证：两人进房后 A 发 martin:event:sync，B 收到 delta（发送方无回声）。
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const io = require('../frontend/node_modules/socket.io-client');
const jdp = require('../frontend/node_modules/jsondiffpatch').create({
  objectHash: (obj, index) => obj.name || obj.title || obj.id || `$$index:${index}`,
});

const API = process.env.API_URL || 'http://localhost:9502';
const SOCKET = process.env.SOCKETIO_URL || 'http://localhost:9092';
const PROJECT = process.env.PROJECT_ID || `sync-verify-${Date.now()}`;

async function login(username, password) {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('login failed ' + username);
  return j.access_token;
}

async function ticket(token) {
  const r = await fetch(`${API}/auth/socket-ticket`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const j = await r.json();
  if (j.code !== 200 || !j.data?.ticket) throw new Error('ticket failed');
  return j.data;
}

function connect(ticket, username) {
  return new Promise((resolve, reject) => {
    const socket = io(`${SOCKET}/project/erd`, {
      transports: ['websocket', 'polling'],
      query: { ticket, username, projectId: PROJECT },
      forceNew: true,
      reconnection: false,
      timeout: 8000,
    });
    const t = setTimeout(() => reject(new Error('join timeout ' + username)), 10000);
    socket.on('connect', () => socket.emit('martin:event:joinRoom', {}));
    socket.once('martin:event:joinRoom', () => {
      clearTimeout(t);
      resolve(socket);
    });
    socket.on('connect_error', (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

const left = { modules: [{ name: 'M1', entities: [] }] };
const right = {
  modules: [{ name: 'M1', entities: [{ title: 'T_USER', fields: [] }] }],
};
const delta = jdp.diff(left, right);
if (!delta) throw new Error('empty delta');

const aTok = await login('admin', '123456');
const bTok = await login('e2e0', '123456');
const aT = await ticket(aTok);
const bT = await ticket(bTok);
const a = await connect(aT.ticket, aT.username);
const b = await connect(bT.ticket, bT.username);

const got = new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('sync timeout')), 8000);
  b.on('martin:event:sync', (p) => {
    clearTimeout(t);
    resolve(p);
  });
  a.on('martin:event:sync', () => {
    clearTimeout(t);
    reject(new Error('sender should not receive own sync'));
  });
});

const ts = Date.now();
a.emit('martin:event:sync', { timestamp: ts, delta });
const payload = await got;
console.log('sync received', {
  username: payload.username,
  timestamp: payload.timestamp,
  hasDelta: !!payload.delta,
});
if (payload.username !== 'admin' || !payload.delta) {
  throw new Error('bad payload');
}
const patched = jdp.patch(JSON.parse(JSON.stringify(left)), payload.delta);
if (!patched.modules?.[0]?.entities?.some((e) => e.title === 'T_USER')) {
  throw new Error('patch result missing T_USER: ' + JSON.stringify(patched));
}
a.close();
b.close();
console.log('verify-socket-sync: PASS');
