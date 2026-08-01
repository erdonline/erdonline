#!/usr/bin/env node
/**
 * 验证：两人进房后 A 发 cursor，B 收到（不含回声）。
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const io = require('../frontend/node_modules/socket.io-client');

const API = process.env.API_URL || 'http://localhost:9502';
const SOCKET = process.env.SOCKETIO_URL || 'http://localhost:9092';
const PROJECT = process.env.PROJECT_ID || `cursor-verify-${Date.now()}`;

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

const aTok = await login('admin', '123456');
const bTok = await login('e2e0', '123456');
const aT = await ticket(aTok);
const bT = await ticket(bTok);
const a = await connect(aT.ticket, aT.username);
const b = await connect(bT.ticket, bT.username);

const got = new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('cursor timeout')), 8000);
  b.on('martin:event:cursor', (p) => {
    clearTimeout(t);
    resolve(p);
  });
  a.on('martin:event:cursor', () => {
    clearTimeout(t);
    reject(new Error('sender should not receive own cursor'));
  });
});

a.emit('martin:event:cursor', { x: 120.5, y: 80 });
const payload = await got;
console.log('cursor received', payload);
if (payload.username !== 'admin' || Number(payload.x) !== 120.5 || Number(payload.y) !== 80) {
  throw new Error('bad payload ' + JSON.stringify(payload));
}
a.close();
b.close();
console.log('verify-socket-cursor: PASS');
