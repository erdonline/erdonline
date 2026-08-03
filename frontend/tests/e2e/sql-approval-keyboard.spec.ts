import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import {
  e2eAccount,
  login,
  openVersionPage,
  saveVersion,
  uniqueProjectName,
} from './helpers';

/**
 * 「发起SQL审批」Modal 键盘闭环
 * — 打开首焦「审批人」；Esc 关；焦点归还触发器；Tab trap 在 dialog
 * — 稳定路径：团队项目 → 版本页「提交工单」→ 详情 → SQL审批（不提交审批）
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
    data: { projectName: name, description: 'sql approval keyboard', tags: 'e2e' },
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

test.describe('发起SQL审批弹层键盘', () => {
  test('SQL审批：首焦审批人；Esc 归还；Tab trap', async ({ page, request }) => {
    test.setTimeout(120_000);
    const account = e2eAccount();
    const projectName = uniqueProjectName('sql-appr-kb');
    const token = await apiToken(request, account.name, account.pass);
    const projectId = await createGroupProject(request, token, projectName);

    try {
      await login(page, account);
      await page.goto(`/design/table/model?projectId=${projectId}`);
      await expect(page).toHaveURL(/projectId=/, { timeout: 15_000 });

      await openVersionPage(page);
      await saveVersion(page);

      const submitBtn = page.getByTestId('version-submit-order-btn');
      await expect(submitBtn).toBeVisible({ timeout: 15_000 });
      await submitBtn.click();

      const detail = page.getByRole('dialog', { name: /版本变更详情/ });
      await expect(detail).toBeVisible({ timeout: 10_000 });

      const trigger = detail.getByRole('button', { name: 'SQL审批' });
      await expect(trigger).toBeVisible();
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: /发起SQL审批/ });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByRole('combobox', { name: '审批人' })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(dialog, page);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
      // 父层详情仍开着：仅关审批子弹
      await expect(detail).toBeVisible();
    } finally {
      await deleteGroup(request, token, projectId).catch(() => {});
    }
  });
});
