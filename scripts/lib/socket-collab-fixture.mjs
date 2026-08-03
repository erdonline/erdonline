/**
 * Shared helpers for Socket.IO collab verify scripts (membership-aware).
 */
export const API = process.env.API_URL || 'http://localhost:9502';
export const SOCKET = process.env.SOCKETIO_URL || 'http://localhost:9092';

export async function login(username, password) {
  const r = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('login failed ' + username + ': ' + JSON.stringify(j));
  return j.access_token;
}

export async function ticket(token) {
  const r = await fetch(`${API}/auth/socket-ticket`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const j = await r.json();
  if (j.code !== 200 || !j.data?.ticket) throw new Error('ticket failed: ' + JSON.stringify(j));
  return j.data;
}

/** Create group project owned by token user; bind peer userId as ordinary member. */
export async function createGroupWithPeer(ownerToken, peerUserId, label = 'socket-verify') {
  const name = `${label}-${Date.now().toString(36)}`;
  const add = await fetch(`${API}/ncnb/project/group/add`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectName: name,
      description: label,
      tags: 'verify',
    }),
  });
  const addJson = await add.json();
  const projectId = addJson.data;
  if (addJson.code !== 200 || !projectId) {
    throw new Error('group add failed: ' + JSON.stringify(addJson));
  }

  const roles = await fetch(`${API}/ncnb/project/group/roles?projectId=${projectId}`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const rolesJson = await roles.json();
  const member = (rolesJson.data || []).find(
    (r) => String(r.roleCode || '').endsWith('_2') || r.roleName === '团队普通成员',
  );
  if (!member?.roleId) throw new Error('no member role: ' + JSON.stringify(rolesJson));

  const bind = await fetch(`${API}/ncnb/project/group/role/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ projectId, roleId: member.roleId, userIds: [peerUserId] }),
  });
  const bindJson = await bind.json();
  if (bindJson.code !== 200) {
    throw new Error('bind peer failed: ' + JSON.stringify(bindJson));
  }
  return { projectId, name };
}

export async function deleteGroup(token, projectId) {
  await fetch(`${API}/ncnb/project/group/delete`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: projectId }),
  });
}
