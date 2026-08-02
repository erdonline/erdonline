import { expect, test } from '@playwright/test';

/**
 * 竞品对照子页 `/compare`：诚实对照表 + CTA → demo / 首页
 */
test.describe('竞品对照页', () => {
  test('加载对照表；顶栏/CTA 可达 demo 与首页', async ({ page }) => {
    await page.goto('/compare');
    await expect(page.getByTestId('compare-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: '诚实对照' })).toBeVisible();

    const table = page.getByRole('table');
    await expect(table.getByRole('columnheader', { name: 'ERD Online' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'dbdiagram' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'dbml 生态' })).toBeVisible();
    await expect(table.getByRole('cell', { name: '版本与 diff' })).toBeVisible();
    await expect(table.getByRole('cell', { name: '开源自部署' })).toBeVisible();
    await expect(table.getByRole('cell', { name: 'MIT + compose' })).toBeVisible();

    await page.getByRole('link', { name: '打开演示' }).click();
    await expect(page).toHaveURL(/\/(demo|s\/public-demo)/, { timeout: 15_000 });

    await page.goto('/compare');
    await page.getByRole('link', { name: '返回产品首页' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('landing-page')).toBeVisible();
  });

  test('落地页「对比」与完整对照链进入 /compare', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('landing-page')).toBeVisible();
    await page.getByRole('navigation', { name: '落地页导航' }).getByRole('link', { name: '竞品对照' }).click();
    await expect(page).toHaveURL(/\/compare/);
    await expect(page.getByTestId('compare-page')).toBeVisible();

    await page.goto('/');
    await page.getByRole('link', { name: '查看完整对照' }).click();
    await expect(page).toHaveURL(/\/compare/);
    await expect(page.getByRole('heading', { name: '诚实对照' })).toBeVisible();
  });
});
