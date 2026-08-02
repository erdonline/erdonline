import { expect, test } from '@playwright/test';
import { login } from './helpers';

/**
 * W6 `/*`：未知路径友好 404 + 返回首页。
 */
test.describe('404 页', () => {
  test('未知路径见友好提示并可返回首页', async ({ page }) => {
    await login(page);
    await page.goto(`/this-path-does-not-exist-${Date.now().toString(36)}`);
    await expect(page.getByText('404', { exact: true })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('抱歉，你访问的页面不存在')).toBeVisible();
    await page.getByRole('button', { name: '返回首页' }).click();
    await expect(page).not.toHaveURL(/this-path-does-not-exist/, {
      timeout: 15_000,
    });
    // `/` 或登录后落到 `/home`
    await expect(page).toHaveURL(/\/($|home)/, { timeout: 15_000 });
  });
});
