import { expect, test } from '@playwright/test';
import { login } from './helpers';

/**
 * W5 404/403：标准 Result + 返回首页 + 打开示例 demo；无 antd reset.css。
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

  test('未知路径可打开示例 demo', async ({ page }) => {
    await login(page);
    await page.goto(`/this-path-does-not-exist-demo-${Date.now().toString(36)}`);
    await expect(page.getByText('抱歉，你访问的页面不存在')).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole('button', { name: '打开示例 demo' }).click();
    await expect(page).toHaveURL(/\/(demo|s\/public-demo)/, { timeout: 15_000 });
  });
});
