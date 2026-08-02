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
    // ADR-0016：Frame 色板走 erd token（禁 Ant 蓝 37,99,235）
    const frameBgs = await page.getByTestId('diagram-frame').evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).backgroundColor),
    );
    for (const bg of frameBgs) {
      expect(bg, `Frame 底色不得含 Ant 蓝：${bg}`).not.toMatch(/37,\s*99,\s*235/);
    }
    expect(
      frameBgs.some((bg) => /47,\s*143,\s*123/.test(bg)),
      `应有 success frameFill（got ${JSON.stringify(frameBgs)}）`,
    ).toBeTruthy();
    await page.getByTestId('share-relation-canvas').screenshot({
      path: 'test-results/ux-walkthrough/demo-frame-theme-tokens.png',
    });
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
    // ADR-0016：边基数标签 chip 可读（白底 + ink600，禁整块半透明）
    const labels = page
      .getByTestId('share-relation-canvas')
      .getByTestId('erd-edge-label');
    const labelCount = await labels.count();
    expect(labelCount, '分享画布应有边标签').toBeGreaterThan(0);
    const labelLook = await labels.first().evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        color: s.color,
        bg: s.backgroundColor,
        opacity: s.opacity,
        fontSize: parseFloat(s.fontSize),
        border: s.borderTopWidth,
        fontWeight: s.fontWeight,
      };
    });
    expect(labelLook.opacity, '标签不得整块半透明').toBe('1');
    expect(labelLook.color).toBe('rgb(68, 82, 95)'); // ink600
    expect(labelLook.bg).toBe('rgb(255, 255, 255)'); // surface
    expect(labelLook.fontSize).toBeGreaterThanOrEqual(11);
    expect(parseInt(labelLook.fontWeight, 10)).toBeGreaterThanOrEqual(500);
    expect(parseFloat(labelLook.border)).toBeGreaterThanOrEqual(1);
    await page.getByTestId('share-relation-canvas').screenshot({
      path: 'test-results/ux-walkthrough/demo-edge-label-chip.png',
    });
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
