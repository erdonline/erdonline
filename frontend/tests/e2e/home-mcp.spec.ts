import { expect, test } from '@playwright/test';

/**
 * Home 次入口：给 Cursor 配 MCP（不抢新建/继续主 CTA）。
 * 不依赖后端：假会话 + 拦截 recent/statistic/settings。
 */
test.describe('Home MCP 次入口', () => {
  test('hero 次链指向文档 MCP 页', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('Authorization', 'e2e-home-mcp');
    });
    const ok = (data: unknown) => ({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 200, data }),
    });
    await page.route('**/ncnb/project/recent**', async (route) => {
      await route.fulfill(
        ok({
          records: [
            {
              id: 'e2e-mcp-proj',
              projectName: 'MCP fixture',
              description: 'e2e',
              type: '1',
              updateTime: '2026-08-28 00:00:00',
            },
          ],
          total: 1,
          size: 6,
        }),
      );
    });
    await page.route('**/ncnb/project/statistic**', async (route) => {
      await route.fulfill(ok({ today: 0, total: 1, groupTotal: 0 }));
    });
    await page.route('**/syst/user/settings/basic**', async (route) => {
      await route.fulfill(ok({ username: 'e2e', avatar: '' }));
    });
    await page.route('**/syst/sysAnnouncement**', async (route) => {
      await route.fulfill(ok({ records: [], total: 0 }));
    });

    await page.goto('/home');
    await expect(page.getByTestId('home-page')).toBeVisible({ timeout: 15_000 });
    const mcp = page.getByTestId('home-mcp-docs');
    await expect(mcp).toBeVisible();
    await expect(mcp).toHaveAttribute(
      'href',
      'https://doc.erdonline.com/docs/guide/api-and-mcp/',
    );
    await expect(mcp).toHaveAccessibleName(/MCP/);
    await expect(page.getByTestId('home-continue-modeling')).toBeVisible();
    await expect(page.getByTestId('home-link-new-project')).toBeVisible();
  });
});
