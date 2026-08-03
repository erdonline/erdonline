#!/usr/bin/env node
/**
 * 验证：两人（同项目成员）进房后 A 发 cursor，B 收到（不含回声）。
 */
import { createRequire } from 'node:module';
import {
  SOCKET,
  createGroupWithPeer,
  deleteGroup,
  login,
  ticket,
} from './lib/socket-collab-fixture.mjs';

const require = createRequire(import.meta.url);
const io = require('../frontend/node_modules/socket.io-client');

const PROJECT = process.env.PROJECT_ID;

async function connect(ticketVal, username, projectId) {
  return new Promise((resolve, reject) => {
    const socket = io(`${SOCKET}/project/erd`, {
      transports: ['websocket', 'polling'],
      query: { ticket: ticketVal, username, projectId },
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
let projectId = PROJECT;
let created = false;
if (!projectId) {
  const g = await createGroupWithPeer(aTok, 'e2e-user-0', 'cursor-verify');
  projectId = g.projectId;
  created = true;
}

try {
  const aT = await ticket(aTok);
  const bT = await ticket(bTok);
  const a = await connect(aT.ticket, aT.username, projectId);
  const b = await connect(bT.ticket, bT.username, projectId);

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
} finally {
  if (created) await deleteGroup(aTok, projectId);
}
