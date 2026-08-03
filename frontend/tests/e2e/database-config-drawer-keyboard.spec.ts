import { expect, test, type Page } from '@playwright/test';
import { e2eAccount, login } from './helpers';

/**
 * 工作台 /databaseConfig 新建/编辑 Drawer 键盘闭环
 * — 打开首焦「连接名称」；Esc 关；焦点归还触发器；Tab trap
 * — 定位：role=button / role=dialog / getByLabel（勿扫 `.ant-*`）
 * — Tab sentinel 在 dialog 外、`.database-config-drawer-root` 内，trap 用 root 断言
 */

async function assertFocusInsideDrawer(page: Page) {
  expect(
    await page.evaluate(() => {
      const root = document.querySelector('.database-config-drawer-root');
      return !!root && root.contains(document.activeElement);
    }),
  ).toBe(true);
}

async function assertTabTrap(page: Page, presses = 12) {
  for (let i = 0; i < presses; i += 1) {
    await page.keyboard.press('Tab');
    await assertFocusInsideDrawer(page);
  }
  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press('Shift+Tab');
    await assertFocusInsideDrawer(page);
  }
}

test.describe('工作台 databaseConfig Drawer 键盘', () => {
  test('新建连接：首焦名称；Esc 归还；Tab trap', async ({ page }) => {
    test.setTimeout(90_000);
    await login(page, e2eAccount());
    await page.goto('/databaseConfig');
    await expect(page.getByText('数据库连接列表')).toBeVisible({
      timeout: 20_000,
    });

    const trigger = page.getByRole('button', { name: '新建连接' });
    await expect(trigger).toBeVisible({ timeout: 10_000 });
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: '新建数据库连接' });
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByLabel('连接名称')).toBeFocused({
      timeout: 5_000,
    });

    await assertTabTrap(page);

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused({ timeout: 5_000 });
  });

  test('编辑：首焦名称；Esc 归还编辑钮；Tab trap', async ({ page, request }) => {
    test.setTimeout(120_000);
    const API = process.env.API_URL || 'http://localhost:9502';
    const stem = `e2e-w${test.info().parallelIndex}-dcdw-${Date.now().toString(36)}`;
    const name = `${stem}-edit`;
    const dsId = `${stem}-id`;

    try {
      await login(page, e2eAccount());
      const token = await page.evaluate(() => localStorage.getItem('Authorization'));
      expect(token).toBeTruthy();

      const create = await request.post(`${API}/ncnb/dataSources`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          id: dsId,
          name,
          type: 'MySQL',
          url: 'jdbc:mysql://127.0.0.1:59999/e2e_fake',
          username: 'e2e',
          password: 'e2e',
          driverClassName: 'com.mysql.cj.jdbc.Driver',
          host: '127.0.0.1',
          port: '59999',
          databaseName: 'e2e_fake',
          connectionType: 'host',
        },
      });
      expect(create.status()).toBe(200);
      expect((await create.json()).code).toBe(200);

      await page.goto('/databaseConfig');
      await expect(page.getByText('数据库连接列表')).toBeVisible({
        timeout: 20_000,
      });
      const row = page.getByRole('row', { name: new RegExp(name) });
      await expect(row).toBeVisible({ timeout: 45_000 });

      const trigger = row.getByRole('button', { name: '编辑' });
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: '编辑数据库连接' });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByLabel('连接名称')).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(page);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
      await expect(row).toBeVisible();
    } finally {
      const token = await page
        .evaluate(() => localStorage.getItem('Authorization'))
        .catch(() => null);
      if (token) {
        const list = await request.get(`${API}/ncnb/dataSources?size=100&current=1`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const listJson = await list.json();
        for (const row of listJson?.data?.records || []) {
          if (String(row.name || '').includes(stem)) {
            await request.delete(`${API}/ncnb/dataSources/${row.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }
      }
    }
  });
});
