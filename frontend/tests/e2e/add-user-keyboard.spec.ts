import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { e2eAccount, login, uniqueProjectName } from './helpers';

/**
 * 「添加成员」Modal 键盘闭环
 * — 打开首焦「选择用户」；Esc 关；焦点归还触发器；Tab trap 在 dialog
 * — 稳定路径：团队项目 → 权限组 → 团队普通成员 → 用户组成员 → 添加成员（不提交）
 */

const API = process.env.API_URL || 'http://localhost:9502';

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
): Promise<string> {
  const add = await request.post(`${API}/ncnb/project/group/add`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { projectName: name, description: 'add user keyboard', tags: 'e2e' },
  });
  const addJson = await add.json();
  const projectId = addJson.data as string;
  if (addJson.code !== 200 || !projectId) {
    throw new Error(`group add failed: ${JSON.stringify(addJson)}`);
  }
  return projectId;
}

async function deleteGroup(request: APIRequestContext, token: string, projectId: string) {
  await request.post(`${API}/ncnb/project/group/delete`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { id: projectId },
  });
}

async function assertFocusInside(dialog: Locator) {
  expect(
    await dialog.evaluate((dlg) => dlg.contains(document.activeElement)),
  ).toBe(true);
}

async function assertTabTrap(dialog: Locator, page: Page, presses = 12) {
  for (let i = 0; i < presses; i += 1) {
    await page.keyboard.press('Tab');
    await assertFocusInside(dialog);
  }
  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press('Shift+Tab');
    await assertFocusInside(dialog);
  }
}

test.describe('添加成员弹层键盘', () => {
  test('添加成员：首焦选择用户；Esc 归还；Tab trap', async ({ page, request }) => {
    test.setTimeout(90_000);
    const account = e2eAccount();
    const projectName = uniqueProjectName('add-user-kb');
    const token = await apiToken(request, account.name, account.pass);
    const projectId = await createGroupProject(request, token, projectName);

    try {
      await login(page, account);
      await page.goto(`/project/group/setting/permission?projectId=${projectId}`);
      await expect(page.getByRole('heading', { name: '用户组' })).toBeVisible({
        timeout: 15_000,
      });

      // 所有者组隐藏「添加成员」；切到普通成员角色
      await expect(page.getByRole('tab', { name: '团队普通成员' })).toBeVisible({
        timeout: 15_000,
      });
      await page.getByRole('tab', { name: '团队普通成员' }).click();
      await expect(page.getByRole('tab', { name: '用户组成员' })).toBeVisible({
        timeout: 15_000,
      });
      await page.getByRole('tab', { name: '用户组成员' }).click();

      const trigger = page.getByRole('button', { name: '添加成员' });
      await expect(trigger).toBeVisible({ timeout: 10_000 });
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: /添加成员/ });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByRole('combobox', { name: '选择用户' })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(dialog, page);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
    } finally {
      await deleteGroup(request, token, projectId).catch(() => {});
    }
  });
});
