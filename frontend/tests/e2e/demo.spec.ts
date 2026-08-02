import { expect, test } from '@playwright/test';

/**
 * P3a 在线 demo：/demo → /s/public-demo 只读关系图（需 db/init/08_public_demo.sql）
 */
test.describe('在线演示', () => {
  test('免登录 /demo 可见演示关系图与复制 CTA', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/demo');
    await expect(page).toHaveURL(/\/s\/public-demo/);
    await expect(page.getByText('功能鉴权示例').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('share-relation-canvas')).toBeVisible();
    await expect(page.getByText('sys_user').first()).toBeVisible();
    await expect(page.getByText('sys_role').first()).toBeVisible();
    await expect(page.getByText('sys_permission').first()).toBeVisible();
    // RBAC + 会话/审计 + 业务订单 ≥ 6 表
    await expect(page.locator('.react-flow__node')).toHaveCount(8, { timeout: 15_000 });
    await expect(page.getByRole('button', { name: '复制到我的项目' })).toBeVisible();
  });
});
