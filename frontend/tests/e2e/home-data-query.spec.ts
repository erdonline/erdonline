import { expect, test } from '@playwright/test';
import { e2eAccount, login } from './helpers';

/**
 * W2：`/dataQuery` 实验空壳下线路由 → 404；主导航无「数据查询」
 */
test.describe('Home 数据查询导航裁剪', () => {
  test.describe.configure({ retries: 1 });

  test('主导航无「数据查询」；深链 404', async ({ page }) => {
    test.setTimeout(60_000);
    await login(page, e2eAccount());
    await page.goto('/home');
    await expect(page.getByTestId('home-link-new-project')).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.getByRole('link', { name: '数据模型' })).toBeVisible();
    await expect(page.getByRole('link', { name: '数据源' })).toBeVisible();
    await expect(page.getByRole('link', { name: '数据查询' })).toHaveCount(0);

    await page.goto('/dataQuery');
    await expect(page.getByTestId('exception-404-gate')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('抱歉，你访问的页面不存在')).toBeVisible();
  });
});
