#!/usr/bin/env node
/**
 * 验证：短票握手 + joinRoom；断线后 leaveRoom 清名单。
 * 前提：backend:9502 + socketio:9092 + redis；e2e0/admin 可登录。
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const io = require('../frontend/node_modules/socket.io-client');

const API = process.env.API_URL || 'http://localhost:9502';
const SOCKET = process.env.SOCKETIO_URL || 'http://localhost:9092';
const PROJECT = process.env.PROJECT_ID || `presence-verify-${Date.now()}`;

async function login(username, password) {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('login failed ' + username + ': ' + JSON.stringify(j));
  return j.access_token;
}

async function ticket(token) {
  const r = await fetch(`${API}/auth/socket-ticket`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const j = await r.json();
  if (j.code !== 200 || !j.data?.ticket) throw new Error('ticket failed: ' + JSON.stringify(j));
  return j.data;
}

function connectPresence(ticket, username) {
  return new Promise((resolve, reject) => {
    const socket = io(`${SOCKET}/project/erd`, {
      transports: ['websocket', 'polling'],
      query: { ticket, username, projectId: PROJECT },
      forceNew: true,
      timeout: 8000,
      reconnection: false,
    });
    const t = setTimeout(() => {
      socket.close();
      reject(new Error('timeout connect ' + username));
    }, 10000);
    socket.on('connect', () => socket.emit('martin:event:joinRoom', {}));
    socket.once('martin:event:joinRoom', (payload) => {
      clearTimeout(t);
      resolve({ socket, payload });
    });
    socket.on('connect_error', (e) => {
      clearTimeout(t);
      reject(new Error('connect_error ' + username + ': ' + e.message));
    });
  });
}

function waitLeave(socket, expectGone) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout leaveRoom')), 10000);
    socket.on('martin:event:leaveRoom', (payload) => {
      const users = (payload?.onlineUser || []).map(String);
      if (users.includes(expectGone)) {
        return; // 忽略无关 leave
      }
      clearTimeout(t);
      resolve(users);
    });
  });
}

const adminToken = await login('admin', '123456');
const e2eToken = await login('e2e0', '123456');
const adminT = await ticket(adminToken);
const e2eT = await ticket(e2eToken);

const a = await connectPresence(adminT.ticket, adminT.username);
console.log('admin joined', a.payload?.onlineUser);

const leaveWait = waitLeave(a.socket, 'e2e0');
const b = await connectPresence(e2eT.ticket, e2eT.username);
const both = (b.payload?.onlineUser || []).map(String);
console.log('e2e0 joined', both);
if (!both.includes('admin') || !both.includes('e2e0')) {
  throw new Error('roster should include both: ' + JSON.stringify(both));
}

b.socket.close();
const after = await leaveWait;
console.log('after e2e0 disconnect', after);
if (after.includes('e2e0')) {
  throw new Error('e2e0 still in roster after disconnect: ' + JSON.stringify(after));
}
if (!after.includes('admin')) {
  throw new Error('admin missing after peer disconnect: ' + JSON.stringify(after));
}

a.socket.close();
console.log('verify-socket-presence: PASS');
