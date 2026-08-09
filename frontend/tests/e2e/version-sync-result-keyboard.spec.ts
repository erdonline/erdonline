import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  openVersionPage,
  saveVersion,
  uniqueProjectName,
  visibleTestId,
} from './helpers';

const API = process.env.API_URL || 'http://localhost:9502';

/**
 * 版本同步结果 Modal.success / Modal.warn 键盘闭环
 * — 首焦「知道了」；Esc / OK 关窗归还「同步」；Tab trap
 * — 须挂真实 dataSourceId（mutate 禁快照通道）；dbversion/dbsync 路由 mock
 */

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

async function clearDataSources(
  request: import('@playwright/test').APIRequestContext,
  token: string,
) {
  const list = await request.get(`${API}/ncnb/dataSources?size=100&current=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listJson = await list.json();
  for (const row of listJson?.data?.records || []) {
    await request.delete(`${API}/ncnb/dataSources/${row.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

async function seedMysqlDs(
  request: import('@playwright/test').APIRequestContext,
  token: string,
  name: string,
): Promise<string> {
  const id = crypto.randomUUID();
  const createDs = await request.post(`${API}/ncnb/dataSources`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      id,
      name,
      type: 'MYSQL',
      url: 'jdbc:mysql://127.0.0.1:3306/e2e',
      username: 'e2e',
      password: 'e2e',
      driverClassName: 'com.mysql.cj.jdbc.Driver',
    },
  });
  expect(createDs.status()).toBe(200);
  return id;
}

async function openSyncConfirm(page: Page) {
  await openVersionPage(page);
  await saveVersion(page);
  const row = page.getByTestId('version-row-1.0.0');
  await expect(row).toBeVisible({ timeout: 10_000 });
  await row.hover();
  await row.getByTestId('row-more-btn').click();

  const trigger = visibleTestId(page, 'version-sync-btn');
  await expect(trigger).toBeEnabled({ timeout: 15_000 });
  await trigger.click();

  const confirm = page.getByRole('dialog', { name: '同步确认' });
  await expect(confirm).toBeVisible({ timeout: 10_000 });
  return { trigger, confirm };
}

test.describe('版本同步结果弹层键盘', () => {
  test('同步成功：首焦知道了；Esc 归还同步；Tab trap', async ({ page, request }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('vsync-ok-kb');
    let dsId = '';
    try {
      await login(page, e2eAccount());
      const token = await page.evaluate(() => localStorage.getItem('Authorization'));
      expect(token).toBeTruthy();
      await clearDataSources(request, token!);
      dsId = await seedMysqlDs(request, token!, `e2e-vsok-${Date.now().toString(36)}`);

      await page.route('**/ncnb/connector/dbversion', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200, data: '0.0.0' }),
        });
      });
      await page.route('**/ncnb/connector/dbsync', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200, data: 'e2e sync ok' }),
        });
      });

      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vsok', 'sync success keyboard');

      const { trigger, confirm } = await openSyncConfirm(page);
      const waitSync = page.waitForResponse(
        (r) =>
          r.url().includes('/ncnb/connector/dbsync') &&
          r.request().method() === 'POST',
        { timeout: 20_000 },
      );
      await confirm.getByRole('button', { name: /同\s*步/ }).click();
      await waitSync;

      const result = page.getByRole('dialog', { name: '同步成功' });
      await expect(result).toBeVisible({ timeout: 15_000 });
      await expect(result.getByRole('button', { name: '知道了' })).toBeFocused({
        timeout: 5_000,
      });
      await expect(result.getByText('e2e sync ok')).toBeVisible();

      await assertTabTrap(result, page);

      await page.keyboard.press('Escape');
      await expect(result).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
    } finally {
      await page.unroute('**/ncnb/connector/dbsync').catch(() => {});
      await page.unroute('**/ncnb/connector/dbversion').catch(() => {});
      if (dsId) {
        const token = await page
          .evaluate(() => localStorage.getItem('Authorization'))
          .catch(() => null);
        if (token) {
          await request
            .delete(`${API}/ncnb/dataSources/${dsId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => {});
        }
      }
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('同步失败：首焦知道了；Esc 归还同步；可再点同步', async ({ page, request }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('vsync-fail-kb');
    let dsId = '';
    try {
      await login(page, e2eAccount());
      const token = await page.evaluate(() => localStorage.getItem('Authorization'));
      expect(token).toBeTruthy();
      await clearDataSources(request, token!);
      dsId = await seedMysqlDs(request, token!, `e2e-vsfl-${Date.now().toString(36)}`);

      await page.route('**/ncnb/connector/dbversion', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 200, data: '0.0.0' }),
        });
      });
      await page.route('**/ncnb/connector/dbsync', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 500, msg: '模拟同步拒绝' }),
        });
      });

      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vsfl', 'sync fail keyboard');

      const { trigger, confirm } = await openSyncConfirm(page);
      const waitSync = page.waitForResponse(
        (r) =>
          r.url().includes('/ncnb/connector/dbsync') &&
          r.request().method() === 'POST',
        { timeout: 20_000 },
      );
      await confirm.getByRole('button', { name: /同\s*步/ }).click();
      await waitSync;

      const result = page.getByRole('dialog', { name: '同步失败' });
      await expect(result).toBeVisible({ timeout: 15_000 });
      await expect(result.getByRole('button', { name: '知道了' })).toBeFocused({
        timeout: 5_000,
      });
      await expect(result.getByText('模拟同步拒绝')).toBeVisible();

      await assertTabTrap(result, page);

      await page.keyboard.press('Escape');
      await expect(result).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
      await expect(trigger).toBeEnabled();
    } finally {
      await page.unroute('**/ncnb/connector/dbsync').catch(() => {});
      await page.unroute('**/ncnb/connector/dbversion').catch(() => {});
      if (dsId) {
        const token = await page
          .evaluate(() => localStorage.getItem('Authorization'))
          .catch(() => null);
        if (token) {
          await request
            .delete(`${API}/ncnb/dataSources/${dsId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => {});
        }
      }
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
