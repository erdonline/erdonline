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
    await expect(page.getByTestId('rf__node-sys_user')).toBeVisible();
    await expect(page.getByTestId('rf__node-sys_role')).toBeVisible();
    await expect(page.getByTestId('rf__node-sys_permission')).toBeVisible();
    // 8 表 + 主图 4 Frame（主体 / RBAC / 会话审计 / 业务）
    await expect(page.locator('.react-flow__node-table')).toHaveCount(8, { timeout: 15_000 });
    await expect(page.getByTestId('diagram-frame')).toHaveCount(4);
    await expect(page.getByTestId('diagram-frame').filter({ hasText: 'RBAC' })).toBeVisible();
    await expect(page.getByTestId('diagram-frame').filter({ hasText: '主体' })).toBeVisible();
    // ADR-0016：主图手排更密 — 节点 flow x 跨度 <1200（旧手排 1280）
    const spanX = await page.locator('.react-flow__node-table').evaluateAll((els) => {
      const xs = els
        .map((el) => {
          const m = (el as HTMLElement).style.transform.match(
            /translate\(([-\d.]+)px/,
          );
          return m ? Number(m[1]) : NaN;
        })
        .filter((n) => Number.isFinite(n));
      return Math.max(...xs) - Math.min(...xs);
    });
    expect(spanX, `主图节点 x 跨度应更密，得 ${spanX}`).toBeLessThan(1200);
    expect(spanX).toBeGreaterThan(900);
    await expect(page.getByRole('button', { name: '复制到我的项目' })).toBeVisible();
    await page.screenshot({
      path: 'test-results/ux-walkthrough/demo-layout-density.png',
      fullPage: false,
    });
  });
});
