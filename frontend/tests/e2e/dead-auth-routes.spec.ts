import { expect, test } from '@playwright/test';

const API = process.env.API_URL || 'http://localhost:9502';

/**
 * 回归：已删除的社交登录 / OAuth password 路径不可用
 */
test.describe('已删认证路径', () => {
  test('前端无登录成功页与微信绑定页', async ({ page }) => {
    await page.goto('/login/success');
    await expect(page.getByText('404', { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('抱歉，你访问的页面不存在')).toBeVisible();

    await page.goto('/account/settings/wechat');
    await expect(page.getByText('404', { exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/微信绑定|绑定微信/)).toHaveCount(0);
  });

  test('后端 /auth/oauth2/** 不可用', async ({ request }) => {
    for (const path of [
      '/auth/oauth2/authorize',
      '/auth/oauth2/token',
      '/auth/oauth2/authorization/wechat',
    ]) {
      const res = await request.get(`${API}${path}`);
      // 401（未认证）或 404（无路由）均表示不可用；禁止 200 业务成功
      expect([401, 403, 404]).toContain(res.status());
    }
  });
});
