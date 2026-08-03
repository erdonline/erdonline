import { expect, test, type Locator, type Page } from '@playwright/test';
import { e2eAccount, login } from './helpers';

const API = process.env.API_URL || 'http://localhost:9502';

/**
 * 工作台 /databaseConfig 删 / 批删确认 Modal 键盘闭环
 * — 首焦「删除」；Esc 关确认且不删、归还触发器；Tab trap
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

async function cleanupByStem(request: import('@playwright/test').APIRequestContext, token: string, stem: string) {
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

async function createViaUi(page: Page, name: string) {
  await page.getByRole('button', { name: '新建连接' }).click();
  await expect(page.getByPlaceholder('例如：生产环境主数据库')).toBeVisible({
    timeout: 15_000,
  });
  await page.getByPlaceholder('例如：生产环境主数据库').fill(name);
  await page.getByPlaceholder('例如：localhost 或 192.168.1.1').fill('127.0.0.1');
  await page.getByPlaceholder('例如：3306').fill('59999');
  await page.getByPlaceholder('例如：mydatabase').fill('e2e_fake');
  await page.getByPlaceholder('例如：com.mysql.cj.jdbc.Driver').fill('com.mysql.cj.jdbc.Driver');
  await page.getByPlaceholder('用户名').fill('e2e');
  await page.getByPlaceholder('密码').fill('e2e');

  const postWait = page.waitForResponse(
    (r) =>
      r.url().includes('/ncnb/dataSources') &&
      r.request().method() === 'POST' &&
      !r.url().includes('ping'),
    { timeout: 20_000 },
  );
  await page.getByRole('button', { name: '保存连接' }).click();
  const postRes = await postWait;
  expect(postRes.status()).toBe(200);
  await expect(page.getByRole('row', { name: new RegExp(name) })).toBeVisible({
    timeout: 30_000,
  });
}

test.describe('工作台 databaseConfig 删确认键盘', () => {
  test('行删：首焦删除；Esc 归还；Tab trap；不删', async ({ page, request }) => {
    test.setTimeout(120_000);
    const stem = `e2e-w${test.info().parallelIndex}-dckb-${Date.now().toString(36)}`;
    const name = `${stem}-row`;
    try {
      await login(page, e2eAccount());
      const token = await page.evaluate(() => localStorage.getItem('Authorization'));
      expect(token).toBeTruthy();
      await cleanupByStem(request, token!, stem);

      await page.goto('/databaseConfig');
      await expect(page.getByText('数据库连接列表')).toBeVisible({ timeout: 20_000 });
      await createViaUi(page, name);

      const delBtn = page.getByRole('button', { name: `删除连接 ${name}` });
      await delBtn.click();

      const confirm = page.getByRole('dialog').filter({ hasText: /不可逆/ });
      await expect(confirm).toBeVisible({ timeout: 10_000 });
      await expect(confirm.getByRole('button', { name: /删\s*除/ })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(confirm, page);

      await page.keyboard.press('Escape');
      await expect(confirm).toHaveCount(0);
      await expect(delBtn).toBeFocused({ timeout: 5_000 });
      await expect(page.getByRole('row', { name: new RegExp(name) })).toBeVisible();
    } finally {
      const token = await page.evaluate(() => localStorage.getItem('Authorization')).catch(() => null);
      if (token) {
        await cleanupByStem(request, token, stem);
      }
    }
  });

  test('批删：首焦删除；Esc 归还；Tab trap；不删', async ({ page, request }) => {
    test.setTimeout(120_000);
    const stem = `e2e-w${test.info().parallelIndex}-dckb-b-${Date.now().toString(36)}`;
    const name = `${stem}-batch`;
    try {
      await login(page, e2eAccount());
      const token = await page.evaluate(() => localStorage.getItem('Authorization'));
      expect(token).toBeTruthy();
      await cleanupByStem(request, token!, stem);

      await page.goto('/databaseConfig');
      await expect(page.getByText('数据库连接列表')).toBeVisible({ timeout: 20_000 });
      await createViaUi(page, name);

      const row = page.getByRole('row', { name: new RegExp(name) });
      await row.getByRole('checkbox').check();

      const batchBtn = page.getByRole('button', { name: '批量删除' });
      await expect(batchBtn).toBeEnabled();
      await batchBtn.click();

      const confirm = page.getByRole('dialog').filter({ hasText: /选中的\s*1\s*条/ });
      await expect(confirm).toBeVisible({ timeout: 10_000 });
      await expect(confirm.getByRole('button', { name: /删\s*除/ })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(confirm, page);

      await page.keyboard.press('Escape');
      await expect(confirm).toHaveCount(0);
      await expect(batchBtn).toBeFocused({ timeout: 5_000 });
      await expect(page.getByRole('row', { name: new RegExp(name) })).toBeVisible();
    } finally {
      const token = await page.evaluate(() => localStorage.getItem('Authorization')).catch(() => null);
      if (token) {
        await cleanupByStem(request, token, stem);
      }
    }
  });
});
