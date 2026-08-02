import { expect, test } from '@playwright/test';
import { e2eAccount, login } from './helpers';

/**
 * W6 `/dataQuery`：与设计器查询同病（exec 打应用库、忽略所选 DS）
 * → HomeLayout 主导航裁剪；路由保留实验深链
 */
test.describe('Home 数据查询导航裁剪', () => {
  test.describe.configure({ retries: 1 });

  test('主导航无「数据查询」；深链见实验提示', async ({ page }) => {
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
    await expect(page).toHaveURL(/\/dataQuery/, { timeout: 15_000 });
    const sheet = page.getByTestId('home-data-query-page');
    await expect(sheet).toBeVisible({ timeout: 15_000 });
    await expect(sheet.getByText('实验功能')).toBeVisible();
    await expect(page.getByRole('link', { name: '数据查询' })).toHaveCount(0);
  });
});
