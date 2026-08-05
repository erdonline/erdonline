import { expect, test } from '@playwright/test';
import { e2eAccount, login, openUserMenu } from './helpers';

const API = process.env.API_URL || 'http://localhost:9502';

/**
 * ADR-0021：无 IdP 凭证时联邦关闭；登录页条件按钮；账密登出闭环（无需真实 IdP）。
 */
test.describe('IdP 联邦（无凭证）', () => {
  test('providers 均为 false；起跳 404', async ({ request }) => {
    const providers = await request.get(`${API}/auth/federate/providers`);
    expect(providers.status()).toBe(200);
    const body = await providers.json();
    expect(body.code).toBe(200);
    expect(body.data?.github).toBe(false);
    expect(body.data?.google).toBe(false);
    expect(body.data?.wechat).toBe(false);

    for (const provider of ['github', 'google', 'wechat']) {
      const res = await request.get(`${API}/auth/federate/${provider}`, {
        maxRedirects: 0,
      });
      expect([404, 400]).toContain(res.status());
    }
  });

  test('登录页无第三方按钮（未配置时）', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('auth-shell-form')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('login-github')).toHaveCount(0);
    await expect(page.getByTestId('login-google')).toHaveCount(0);
    await expect(page.getByTestId('login-wechat')).toHaveCount(0);
    await expect(page.getByTestId('login-federate-unconfigured')).toBeVisible();
    await expect(page.getByText('第三方登录未配置')).toBeVisible();
  });

  test('providers mock 为 true 时显示对应按钮', async ({ page }) => {
    await page.route('**/auth/federate/providers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: { github: true, google: true, wechat: false },
        }),
      });
    });
    await page.goto('/login');
    await expect(page.getByTestId('auth-shell-form')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('login-github')).toBeVisible();
    await expect(page.getByTestId('login-google')).toBeVisible();
    await expect(page.getByLabel('使用 GitHub 登录')).toBeVisible();
    await expect(page.getByTestId('login-github')).toHaveAttribute(
      'href',
      '/auth/federate/github',
    );
    await expect(page.getByTestId('login-google')).toHaveAttribute(
      'href',
      '/auth/federate/google',
    );
    await expect(page.getByTestId('login-wechat')).toHaveCount(0);
    await expect(page.getByTestId('login-federate-unconfigured')).toHaveCount(0);
  });

  test('账密登录后退出清除会话（联邦同源 logout）', async ({ page }) => {
    await login(page, e2eAccount());
    await page.goto('/home');
    await expect(page.getByTestId('user-menu-trigger')).toBeVisible({ timeout: 15_000 });
    const authed = await page.evaluate(() => localStorage.getItem('Authorization'));
    expect(authed).toBeTruthy();

    await openUserMenu(page);
    await page.getByRole('menuitem', { name: '退出登录' }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    const cleared = await page.evaluate(() => localStorage.getItem('Authorization'));
    expect(cleared).toBeNull();
  });
});
