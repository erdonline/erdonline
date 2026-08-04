import { expect, test } from '@playwright/test';

const API = process.env.API_URL || 'http://localhost:9502';

/**
 * ADR-0021：无 IdP 凭证时联邦关闭；旧社交路径仍不可用。
 */
test.describe('IdP 联邦（无凭证）', () => {
  test('providers 均为 false；起跳 404', async ({ request }) => {
    const providers = await request.get(`${API}/auth/federate/providers`);
    expect(providers.status()).toBe(200);
    const body = await providers.json();
    expect(body.code).toBe(200);
    expect(body.data?.google).toBe(false);
    expect(body.data?.wechat).toBe(false);

    for (const provider of ['google', 'wechat']) {
      const res = await request.get(`${API}/auth/federate/${provider}`, {
        maxRedirects: 0,
      });
      expect([404, 400]).toContain(res.status());
    }
  });

  test('登录页无第三方按钮（未配置时）', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('auth-shell-form')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('login-google')).toHaveCount(0);
    await expect(page.getByTestId('login-wechat')).toHaveCount(0);
  });
});
