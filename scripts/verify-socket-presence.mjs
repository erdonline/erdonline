#!/usr/bin/env node
/**
 * 验证：短票握手 + joinRoom（须为 project_user）；断线后 leaveRoom 清名单。
 * 前提：backend:9502 + socketio:9092 + redis；admin/e2e0 可登录。
 */
import { createRequire } from 'node:module';
import {
  API,
  SOCKET,
  createGroupWithPeer,
  deleteGroup,
  login,
  ticket,
} from './lib/socket-collab-fixture.mjs';

const require = createRequire(import.meta.url);
const io = require('../frontend/node_modules/socket.io-client');

const PROJECT = process.env.PROJECT_ID;

async function connectPresence(ticketVal, username, projectId) {
  return new Promise((resolve, reject) => {
    const socket = io(`${SOCKET}/project/erd`, {
      transports: ['websocket', 'polling'],
      query: { ticket: ticketVal, username, projectId },
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
        return;
      }
      clearTimeout(t);
      resolve(users);
    });
  });
}

const adminToken = await login('admin', '123456');
const e2eToken = await login('e2e0', '123456');
let projectId = PROJECT;
let created = false;
if (!projectId) {
  const g = await createGroupWithPeer(adminToken, 'e2e-user-0', 'presence-verify');
  projectId = g.projectId;
  created = true;
}
console.log('projectId', projectId, 'API', API);

const adminT = await ticket(adminToken);
const e2eT = await ticket(e2eToken);

try {
  const a = await connectPresence(adminT.ticket, adminT.username, projectId);
  console.log('admin joined', a.payload?.onlineUser);

  const leaveWait = waitLeave(a.socket, 'e2e0');
  const b = await connectPresence(e2eT.ticket, e2eT.username, projectId);
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
} finally {
  if (created) await deleteGroup(adminToken, projectId);
}
