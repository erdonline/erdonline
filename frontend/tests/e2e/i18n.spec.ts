import { expect, test } from '@playwright/test';
import { e2eAccount, login, uniqueProjectName } from './helpers';

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

  test('设计器 save-status 随 locale 切换文案', async ({ page }) => {
    await login(page, e2eAccount());
    await page.goto('/project/person');
    await expect(page.getByTestId('project-person-page')).toBeVisible({ timeout: 15_000 });
    if ((await page.getByTestId('project-list-open-link').count()) === 0) {
      await page.getByTestId('project-create-trigger').click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      const projectName = uniqueProjectName('i18n-chrome');
      await dialog.getByPlaceholder('请输入项目名').fill(projectName);
      await dialog.getByPlaceholder('请输入项目描述').fill('i18n chrome locale');
      await dialog.getByRole('button', { name: /确\s*定/ }).click();
      await expect(
        page.getByTestId('project-list-open-link').filter({ hasText: projectName }),
      ).toBeVisible({ timeout: 15_000 });
    }
    await page.getByTestId('project-list-open-link').first().click();
    await expect(page).toHaveURL(/\/design\/table\/model/, { timeout: 15_000 });
    const saveStatus = page.getByTestId('save-status');
    await expect(saveStatus).toHaveText('已落盘', { timeout: 25_000 });

    // DesignLayout 的 LocaleSwitcher 在 ⋯ overflow 内；此处用 umi_locale 持久化机制验证 chrome 文案
    await page.evaluate(() => localStorage.setItem('umi_locale', 'en-US'));
    await page.reload();
    await expect(saveStatus).toHaveText('Saved to server', { timeout: 25_000 });

    await page.evaluate(() => localStorage.setItem('umi_locale', 'zh-CN'));
    await page.reload();
    await expect(saveStatus).toHaveText('已落盘', { timeout: 25_000 });
  });
});
