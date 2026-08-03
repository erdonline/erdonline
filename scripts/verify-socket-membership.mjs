#!/usr/bin/env node
/**
 * R-AUTH-05 负向：合法短票但对他人/不存在 projectId → handshake 拒绝（connect_error）。
 * 成员仍可用真实项目进房（由 verify-socket-presence 覆盖）。
 */
import { createRequire } from 'node:module';
import { SOCKET, createGroupWithPeer, deleteGroup, login, ticket } from './lib/socket-collab-fixture.mjs';

const require = createRequire(import.meta.url);
const io = require('../frontend/node_modules/socket.io-client');

function expectConnectRejected(ticketVal, username, projectId) {
  return new Promise((resolve, reject) => {
    const socket = io(`${SOCKET}/project/erd`, {
      transports: ['websocket', 'polling'],
      query: { ticket: ticketVal, username, projectId },
      forceNew: true,
      reconnection: false,
      timeout: 8000,
    });
    const t = setTimeout(() => {
      socket.close();
      reject(new Error('expected connect_error, timed out'));
    }, 10000);
    socket.on('connect', () => {
      clearTimeout(t);
      socket.close();
      reject(new Error('non-member should not connect for project ' + projectId));
    });
    socket.on('connect_error', (e) => {
      clearTimeout(t);
      socket.close();
      resolve(e.message || String(e));
    });
  });
}

function expectConnectOk(ticketVal, username, projectId) {
  return new Promise((resolve, reject) => {
    const socket = io(`${SOCKET}/project/erd`, {
      transports: ['websocket', 'polling'],
      query: { ticket: ticketVal, username, projectId },
      forceNew: true,
      reconnection: false,
      timeout: 8000,
    });
    const t = setTimeout(() => {
      socket.close();
      reject(new Error('member connect timeout'));
    }, 10000);
    socket.on('connect', () => {
      clearTimeout(t);
      socket.close();
      resolve();
    });
    socket.on('connect_error', (e) => {
      clearTimeout(t);
      reject(new Error('member connect_error: ' + e.message));
    });
  });
}

const adminTok = await login('admin', '123456');
const e2eTok = await login('e2e0', '123456');
const g = await createGroupWithPeer(adminTok, 'e2e-user-0', 'acl-verify');
const adminT = await ticket(adminTok);
const e2eT = await ticket(e2eTok);

try {
  const err = await expectConnectRejected(e2eT.ticket, e2eT.username, 'not-a-member-project-id');
  console.log('non-member rejected:', err);

  await expectConnectOk(adminT.ticket, adminT.username, g.projectId);
  await expectConnectOk(e2eT.ticket, e2eT.username, g.projectId);
  console.log('members accepted for', g.projectId);
  console.log('verify-socket-membership: PASS');
} finally {
  await deleteGroup(adminTok, g.projectId);
}
