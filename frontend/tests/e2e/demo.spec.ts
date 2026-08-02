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
    // ADR-0016：分享只读与设计器同用 ErdRelationEdge / relationEdgeRoute
    const modes = page
      .getByTestId('share-relation-canvas')
      .getByTestId('erd-edge-route-mode');
    const modeCount = await modes.count();
    expect(modeCount, '分享画布应暴露 erdSmooth route-mode').toBeGreaterThan(0);
    const modeList = await modes.evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-mode') || ''),
    );
    for (const m of modeList) {
      expect(m).toMatch(/^(default|centerX|bypass|twoBend|astar)$/);
    }
    // 演示图含 hub（用户/角色等）：至少一条 hub 扇出非 0
    const hubFans = await modes.evaluateAll((els) =>
      els.map((el) => Number(el.getAttribute('data-hub-fan') || '0')),
    );
    expect(
      hubFans.some((n) => n !== 0),
      `分享页 hub 扇出应有非零 data-hub-fan（got ${JSON.stringify(hubFans)}）`,
    ).toBeTruthy();
    await expect(page.getByRole('button', { name: '复制到我的项目' })).toBeVisible();
    await page.screenshot({
      path: 'test-results/ux-walkthrough/demo-layout-density.png',
      fullPage: false,
    });
    await page.getByTestId('share-relation-canvas').screenshot({
      path: 'test-results/ux-walkthrough/demo-share-edge-routing.png',
    });
  });
});
