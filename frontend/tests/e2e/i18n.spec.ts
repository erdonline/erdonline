import { expect, test } from '@playwright/test';

/**
 * i18n MVP（ADR-0023）：umi locale 插件 + 手动 LocaleSwitcher。
 * 验证：默认 zh-CN；UI 切换 en-US 后 formatMessage 生效并持久化；切回 zh-CN。
 * 不断言中文可见文案为唯一定位锚（e2e-locators.mdc）：先 data-testid，再分离断言文案。
 */

test.describe('i18n：手动语言切换', () => {
  test('LocaleSwitcher 切换 en-US 持久化并切回 zh-CN', async ({ page }) => {
    await page.goto('/login');
    const switcher = page.getByTestId('locale-switcher');
    await expect(switcher).toBeVisible();

    const skipNav = page.getByTestId('auth-skip-nav');
    await expect(skipNav).toHaveAttribute('aria-label', '跳过导航');

    const loginSubmit = page.getByTestId('login-submit');
    await expect(loginSubmit).toHaveText(/登\s*录/);

    await switcher.click();
    await page.getByRole('option', { name: 'English' }).click();
    await expect(skipNav).toHaveAttribute('aria-label', 'Skip navigation');
    await expect(loginSubmit).toHaveText('Sign in');

    const storedEn = await page.evaluate(() => localStorage.getItem('umi_locale'));
    expect(storedEn).toBe('en-US');

    await page.reload();
    await expect(skipNav).toHaveAttribute('aria-label', 'Skip navigation');
    await expect(loginSubmit).toHaveText('Sign in');

    await switcher.click();
    await page.getByRole('option', { name: '中文' }).click();
    await expect(skipNav).toHaveAttribute('aria-label', '跳过导航');
    await expect(loginSubmit).toHaveText(/登\s*录/);

    const storedZh = await page.evaluate(() => localStorage.getItem('umi_locale'));
    expect(storedZh).toBe('zh-CN');
  });

  test('register-submit 随 LocaleSwitcher 切换文案', async ({ page }) => {
    await page.goto('/register');
    const registerSubmit = page.getByTestId('register-submit');
    await expect(registerSubmit).toHaveText(/注\s*册/);

    await page.getByTestId('locale-switcher').click();
    await page.getByRole('option', { name: 'English' }).click();
    await expect(registerSubmit).toHaveText('Register');
  });
});
