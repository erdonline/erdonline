import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { e2eAccount, login, uniqueProjectName } from './helpers';

const API = process.env.API_URL || 'http://localhost:9502';

/**
 * 团队「用户组成员」移除确认 Modal 键盘闭环
 * — 首焦「移除」；Esc 关确认且不移、归还移除钮；Tab trap
 * — 不踩 add-user-keyboard / group-layout-nav 旅程
 */

async function apiToken(request: APIRequestContext, username: string, password: string) {
  const r = await request.post(`${API}/auth/login`, {
    data: { username, password },
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`login failed: ${username}`);
  return j.access_token as string;
}

async function createGroupProject(
  request: APIRequestContext,
  token: string,
  name: string,
) {
  const add = await request.post(`${API}/ncnb/project/group/add`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { projectName: name, description: 'group user remove kb e2e', tags: 'e2e' },
  });
  const addJson = await add.json();
  expect(addJson.code).toBe(200);
  const projectId = addJson.data as string;
  expect(projectId).toBeTruthy();
  return projectId;
}

async function bindMember(
  request: APIRequestContext,
  token: string,
  projectId: string,
  peerUserId: string,
) {
  const roles = await request.get(`${API}/ncnb/project/group/roles?projectId=${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const rolesJson = await roles.json();
  const member = (rolesJson.data || []).find(
    (r: { roleCode?: string; roleName?: string }) =>
      String(r.roleCode || '').endsWith('_2') || r.roleName === '团队普通成员',
  );
  if (!member?.roleId) throw new Error(`no member role: ${JSON.stringify(rolesJson)}`);

  const bind = await request.post(`${API}/ncnb/project/group/role/users`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { projectId, roleId: member.roleId, userIds: [peerUserId] },
  });
  const bindJson = await bind.json();
  if (bindJson.code !== 200) {
    throw new Error(`bind peer failed: ${JSON.stringify(bindJson)}`);
  }
  return member.roleId as string;
}

async function deleteGroupProject(
  request: APIRequestContext,
  token: string,
  projectId: string,
) {
  await request
    .post(`${API}/ncnb/project/group/delete`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { id: projectId },
    })
    .catch(() => {});
}

async function assertFocusInside(dialog: Locator) {
  expect(
    await dialog.evaluate((dlg) => dlg.contains(document.activeElement)),
  ).toBe(true);
}

async function assertTabTrap(dialog: Locator, page: Page, presses = 8) {
  for (let i = 0; i < presses; i += 1) {
    await page.keyboard.press('Tab');
    await assertFocusInside(dialog);
  }
  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press('Shift+Tab');
    await assertFocusInside(dialog);
  }
}

test.describe('团队成员移除确认键盘', () => {
  test('移除确认：首焦移除；Esc 归还不移；Tab trap', async ({ page, request }) => {
    test.setTimeout(90_000);
    const account = e2eAccount();
    const token = await apiToken(request, account.name, account.pass);
    const projectName = uniqueProjectName('group-user-rm-kb');
    const projectId = await createGroupProject(request, token, projectName);

    const peerIdx = (test.info().parallelIndex + 8) % 16;
    const peerName = `e2e${peerIdx}`;
    const peerUserId = `e2e-user-${peerIdx}`;

    try {
      await bindMember(request, token, projectId, peerUserId);

      await login(page, account);
      await page.goto(`/project/group/setting/permission?projectId=${projectId}`);
      await expect(page.getByRole('heading', { name: '用户组' })).toBeVisible({
        timeout: 15_000,
      });

      await expect(page.getByRole('tab', { name: '团队普通成员' })).toBeVisible({
        timeout: 15_000,
      });
      await page.getByRole('tab', { name: '团队普通成员' }).click();
      await expect(page.getByRole('tab', { name: '用户组成员' })).toBeVisible({
        timeout: 15_000,
      });
      await page.getByRole('tab', { name: '用户组成员' }).click();

      const trigger = page.getByRole('button', { name: `移除成员 ${peerName}` });
      await expect(trigger).toBeVisible({ timeout: 15_000 });
      await trigger.click();

      const confirm = page.getByRole('dialog', { name: '移除成员' });
      await expect(confirm).toBeVisible({ timeout: 10_000 });
      await expect(confirm.getByRole('button', { name: /移\s*除/ })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(confirm, page);

      await page.keyboard.press('Escape');
      await expect(confirm).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
      await expect(trigger).toBeVisible();
    } finally {
      await deleteGroupProject(request, token, projectId);
    }
  });
});
