#!/usr/bin/env node
/**
 * 验证：短票握手 + joinRoom 收到 onlineUser。
 * 前提：backend:9502 + socketio:9092 + redis。
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const io = require('../frontend/node_modules/socket.io-client');

const API = process.env.API_URL || 'http://localhost:9502';
const SOCKET = process.env.SOCKETIO_URL || 'http://localhost:9092';
const USER = process.env.USER_NAME || 'admin';
const PASS = process.env.PASSWORD || '123456';
const PROJECT = process.env.PROJECT_ID || 'presence-verify';

async function login() {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USER, password: PASS }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('login failed: ' + JSON.stringify(j));
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

function joinOnce(ticket, username) {
  return new Promise((resolve, reject) => {
    const socket = io(`${SOCKET}/project/erd`, {
      transports: ['websocket', 'polling'],
      query: { ticket, username, projectId: PROJECT },
      forceNew: true,
      timeout: 8000,
    });
    const t = setTimeout(() => {
      socket.close();
      reject(new Error('timeout waiting joinRoom'));
    }, 10000);
    socket.on('connect', () => socket.emit('martin:event:joinRoom', {}));
    socket.on('martin:event:joinRoom', (payload) => {
      clearTimeout(t);
      const users = payload?.onlineUser || [];
      console.log('OK joinRoom', { username: payload?.username, onlineUser: users });
      socket.close();
      if (!users.map(String).includes(username)) {
        reject(new Error('roster missing self: ' + JSON.stringify(payload)));
        return;
      }
      resolve(payload);
    });
    socket.on('connect_error', (e) => {
      clearTimeout(t);
      reject(new Error('connect_error: ' + e.message));
    });
    socket.on('martin:event:error', (m) => console.warn('event:error', m));
  });
}

const token = await login();
const t = await ticket(token);
await joinOnce(t.ticket, t.username);
console.log('verify-socket-presence: PASS');
