import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  openVersionPage,
  uniqueProjectName,
} from './helpers';

const API = process.env.API_URL || 'http://localhost:9502';

/**
 * 初始化基线 Modal 键盘闭环
 * — 打开首焦版本号；Esc 关；焦点归还触发器；Tab trap 在 dialog
 * 前置：账号下有 JDBC 数据源且该 dbKey 尚无历史版本（init=true & hasDB=true）
 */

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

test.describe('初始化基线弹层键盘', () => {
  test('初始化基线：首焦版本号；Esc 归还；Tab trap', async ({ page, request }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('vinit-kb');
    let dsId = '';
    try {
      await login(page, e2eAccount());
      const token = await page.evaluate(() => localStorage.getItem('Authorization'));
      expect(token).toBeTruthy();
      const headers = { Authorization: `Bearer ${token}` };

      // 清空账号数据源，避免脏 DB 导致 init/hasDB 不稳定
      const list = await request.get(`${API}/ncnb/dataSources?size=100&current=1`, {
        headers,
      });
      const listJson = await list.json();
      for (const row of listJson?.data?.records || []) {
        await request.delete(`${API}/ncnb/dataSources/${row.id}`, { headers });
      }

      dsId = crypto.randomUUID();
      const createDs = await request.post(`${API}/ncnb/dataSources`, {
        headers,
        data: {
          id: dsId,
          name: `e2e-initkb-${Date.now().toString(36)}`,
          type: 'MYSQL',
          url: 'jdbc:mysql://127.0.0.1:3306/e2e',
          username: 'e2e',
          password: 'e2e',
          driverClassName: 'com.mysql.cj.jdbc.Driver',
        },
      });
      expect(createDs.status()).toBe(200);

      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vinit', 'init keyboard');
      await openVersionPage(page);

      const trigger = page.getByTestId('version-init-btn');
      await expect(trigger).toBeEnabled({ timeout: 20_000 });
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: /初始化基线/ });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByRole('textbox', { name: '版本号' })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(dialog, page);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
    } finally {
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
