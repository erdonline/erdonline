import { expect, test } from '@playwright/test';
import { expectToast, login } from './helpers';

/**
 * W2 `/project/notice`：首页「更多公告」→ 列表可读；失败有 toast。
 */

test.describe('项目公告', () => {
  test('首页更多公告 → 列表可见', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);
    await page.goto('/home');
    await expect(page.getByRole('link', { name: '更多公告' })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('link', { name: '更多公告' }).click();
    await expect(page).toHaveURL(/\/project\/notice/, { timeout: 15_000 });
    await expect(page.getByTestId('project-notice-page')).toBeVisible();
    await expect(page.getByText('公告').first()).toBeVisible({ timeout: 10_000 });
    // 种子库有历史公告标题
    await expect(
      page.getByTestId('project-notice-page').getByRole('link', { name: /ERDOnline/ }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('公告加载失败有 toast', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page);
    await page.route('**/syst/sysAnnouncement', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 500, msg: '加载公告失败' }),
      });
    });
    await page.goto('/project/notice');
    await expect(page.getByTestId('project-notice-page')).toBeVisible({
      timeout: 15_000,
    });
    await expectToast(page, '加载公告失败');
    await page.unroute('**/syst/sysAnnouncement');
  });
});
