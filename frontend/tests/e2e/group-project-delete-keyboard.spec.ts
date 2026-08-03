import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { e2eAccount, login, uniqueProjectName } from './helpers';

const API = process.env.API_URL || 'http://localhost:9502';

/**
 * 团队项目「基本设置」删确认 Modal 键盘闭环
 * — 首焦「删除」；Esc 关确认且不删、归还删钮；Tab trap
 * — 不踩 project-list-keyboard / group-basic-setting 旅程
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
    data: { projectName: name, description: 'group delete kb e2e', tags: 'e2e' },
  });
  const addJson = await add.json();
  expect(addJson.code).toBe(200);
  const projectId = addJson.data as string;
  expect(projectId).toBeTruthy();
  return projectId;
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

test.describe('团队项目删确认键盘', () => {
  test('删确认：首焦删除；Esc 归还不删；Tab trap', async ({ page, request }) => {
    test.setTimeout(90_000);
    const account = e2eAccount();
    const token = await apiToken(request, account.name, account.pass);
    const projectName = uniqueProjectName('group-del-kb');
    const projectId = await createGroupProject(request, token, projectName);

    try {
      await login(page, account);
      await page.goto(`/project/group/setting/basic?projectId=${projectId}`);
      await expect(page.getByRole('heading', { name: '基本设置' })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByRole('heading', { name: '删除项目' })).toBeVisible();

      const trigger = page.getByRole('button', { name: '删除团队项目' });
      await expect(trigger).toBeVisible();
      await trigger.click();

      const confirm = page.getByRole('dialog', { name: '删除项目' });
      await expect(confirm).toBeVisible({ timeout: 10_000 });
      await expect(confirm.getByRole('button', { name: /删\s*除/ })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(confirm, page);

      await page.keyboard.press('Escape');
      await expect(confirm).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
      await expect(page.getByRole('heading', { name: '基本设置' })).toBeVisible();
      await expect(page.getByLabel('项目名')).toHaveValue(projectName);
    } finally {
      await deleteGroupProject(request, token, projectId);
    }
  });
});
