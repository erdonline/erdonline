import { expect, test } from '@playwright/test';

/**
 * P3a 在线 demo：/demo → /s/public-demo 只读关系图（需 db/init/08_public_demo.sql）
 */
test.describe('在线演示', () => {
  test('免登录 /demo 可见演示关系图与复制 CTA', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/demo');
    await expect(page).toHaveURL(/\/s\/public-demo/);
    await expect(page.getByText('功能鉴权示例').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('share-relation-canvas')).toBeVisible();
    // ADR-0016：meta（hint/描述/切图）再收 → 画布吃满顶栏下视口
    const meta = page.getByTestId('share-page-meta');
    await expect(meta).toBeVisible();
    await expect(meta.getByText(/匿名只读/)).toBeVisible();
    const metaH = await meta.evaluate((el) => el.getBoundingClientRect().height);
    expect(metaH, `share meta 高应 ≤72（含切图条），得 ${metaH}`).toBeLessThanOrEqual(72);
    const canvasH = await page.getByTestId('share-relation-canvas').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return {h: r.height, top: r.top};
    });
    const vh = await page.evaluate(() => window.innerHeight);
    expect(canvasH.h, `画布高应 >480，得 ${canvasH.h}`).toBeGreaterThan(480);
    expect(canvasH.h, `画布应占视口过半，得 ${canvasH.h}/${vh}`).toBeGreaterThan(vh * 0.5);
    // meta 收紧后画布应更接近视口主导（禁 hint/描述松距抢高）
    expect(canvasH.h, `画布应 ≥视口 55%，得 ${canvasH.h}/${vh}`).toBeGreaterThanOrEqual(vh * 0.55);
    // 底边折叠条常驻（~32px）；画布下缘贴条上方而非贴死视口底
    expect(canvasH.top + canvasH.h, '画布应贴近视口底（含折叠条）').toBeGreaterThan(vh - 48);
    await page.screenshot({
      path: 'test-results/ux-walkthrough/demo-share-meta-dense.png',
      fullPage: false,
    });
    await expect(page.getByRole('button', { name: /展开表清单/ })).toBeVisible();
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
    // ADR-0016：Frame 标题栏再压（height ≤22）
    const chromeH = await page
      .locator('.erd-frame-chrome')
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).height));
    expect(chromeH, `Frame chrome 应 ≤22px，得 ${chromeH}`).toBeLessThanOrEqual(22);
    expect(chromeH).toBeGreaterThanOrEqual(18);
    // MiniMap 与 sunk 画布同底（禁 RF 默认 #fff；背景在 panel，非 svg）
    const miniBg = await page
      .locator('.react-flow__minimap')
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(miniBg).toBe('rgb(250, 251, 252)'); // surfaceSunk
    // Controls：surface + 密按钮（与 MiniMap 同角 chrome）
    const ctrl = await page.locator('.react-flow__controls').evaluate((el) => {
      const cs = getComputedStyle(el);
      const btn = el.querySelector('.react-flow__controls-button');
      const bs = btn ? getComputedStyle(btn) : null;
      return {
        bg: cs.backgroundColor,
        btnH: bs ? parseFloat(bs.height) : NaN,
      };
    });
    expect(ctrl.bg).toBe('rgb(255, 255, 255)'); // --erd-surface
    expect(ctrl.bg).not.toBe('rgb(254, 254, 254)');
    expect(ctrl.btnH, `Controls 按钮高应 ≤22，得 ${ctrl.btnH}`).toBeLessThanOrEqual(
      22,
    );
    await page.getByTestId('share-relation-canvas').screenshot({
      path: 'test-results/ux-walkthrough/demo-frame-theme-tokens.png',
    });
    // ADR-0016：主图手排更密 — 节点 flow x 跨度 <1100（列间距 ~28px）
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
    expect(spanX, `主图节点 x 跨度应更密，得 ${spanX}`).toBeLessThan(1100);
    expect(spanX).toBeGreaterThan(900);
    // ADR-0016：分享只读隐藏 relationNoShow（与设计器同密）
    await expect(
      page.getByTestId('rf__node-sys_user').getByText('del_flag'),
    ).toHaveCount(0);
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
    // ADR-0016：边基数标签 chip 扫读（白底 + ink900/600，禁整块半透明）
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
        padX: parseFloat(s.paddingLeft),
        padY: parseFloat(s.paddingTop),
        radius: parseFloat(s.borderTopLeftRadius),
      };
    });
    expect(labelLook.opacity, '标签不得整块半透明').toBe('1');
    expect(labelLook.color).toBe('rgb(11, 28, 44)'); // ink900
    expect(labelLook.bg).toBe('rgb(255, 255, 255)'); // surface
    expect(labelLook.fontSize).toBeGreaterThanOrEqual(12);
    expect(parseInt(labelLook.fontWeight, 10)).toBeGreaterThanOrEqual(600);
    expect(parseFloat(labelLook.border)).toBeGreaterThanOrEqual(1);
    expect(labelLook.padX, '密图 chip 水平 padding').toBeLessThanOrEqual(4);
    expect(labelLook.padY, '密图 chip 垂直 padding').toBeLessThanOrEqual(2);
    expect(labelLook.radius).toBeLessThanOrEqual(3);
    // ADR-0016：基数 chip 碰撞避让（bundle 拉伸 + AABB）；密图标签 AABB 不得两两重叠
    const nudges = page
      .getByTestId('share-relation-canvas')
      .getByTestId('erd-edge-label-nudge');
    await expect(nudges.first()).toBeAttached();
    const nudgeVals = await nudges.evaluateAll((els) =>
      els.map((el) => ({
        dx: Number(el.getAttribute('data-dx') || '0'),
        dy: Number(el.getAttribute('data-dy') || '0'),
      })),
    );
    expect(
      nudgeVals.some((n) => n.dx !== 0 || n.dy !== 0),
      `密 FK 演示图应有非零 label nudge（got ${JSON.stringify(nudgeVals.slice(0, 8))}）`,
    ).toBeTruthy();
    const labelBoxes = await labels.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      }),
    );
    let overlapPairs = 0;
    for (let i = 0; i < labelBoxes.length; i++) {
      for (let j = i + 1; j < labelBoxes.length; j++) {
        const a = labelBoxes[i];
        const b = labelBoxes[j];
        const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (overlapX > 1 && overlapY > 1) overlapPairs += 1;
      }
    }
    expect(overlapPairs, `边标签 AABB 重叠对数应为 0（got ${overlapPairs}）`).toBe(0);
    // ADR-0016：分享只读同 SCSS — 表头实体名主标题 vs 中文 meta
    const shareUser = page
      .getByTestId('share-relation-canvas')
      .getByTestId('rf__node-sys_user');
    await expect(shareUser).toBeVisible();
    const headerHierarchy = await shareUser.locator('.erd-table-header').evaluate((el) => {
      const title = el.querySelector('.erd-table-title');
      const chn = el.querySelector('.erd-table-chnname');
      if (!title || !chn) return null;
      const ts = getComputedStyle(title);
      const cs = getComputedStyle(chn);
      return {
        titleSize: parseFloat(ts.fontSize),
        titleWeight: parseInt(ts.fontWeight, 10),
        titleColor: ts.color,
        chnSize: parseFloat(cs.fontSize),
        chnWeight: parseInt(cs.fontWeight, 10),
        chnOpacity: parseFloat(cs.opacity),
        chnText: (chn.textContent || '').trim(),
      };
    });
    expect(headerHierarchy).not.toBeNull();
    expect(headerHierarchy!.chnText).toBe('用户');
    expect(headerHierarchy!.titleSize).toBeGreaterThanOrEqual(14);
    expect(headerHierarchy!.titleWeight).toBeGreaterThanOrEqual(700);
    expect(headerHierarchy!.titleColor).toBe('rgb(11, 28, 44)'); // ink900
    expect(headerHierarchy!.chnSize).toBeLessThan(headerHierarchy!.titleSize);
    expect(headerHierarchy!.chnWeight).toBeLessThan(headerHierarchy!.titleWeight);
    expect(headerHierarchy!.chnOpacity).toBeLessThan(1);
    // ADR-0016：分享只读同 SCSS — 字段名主列 / 类型右对齐次要栏
    const shareField = shareUser.locator('.erd-field-row').first();
    await expect(shareField).toBeVisible();
    const fieldScan = await shareField.evaluate((el) => {
      const name = el.querySelector('.erd-field-name');
      const type = el.querySelector('.erd-field-type');
      if (!name || !type) return null;
      const ns = getComputedStyle(name);
      const ts = getComputedStyle(type);
      return {
        nameWeight: parseInt(ns.fontWeight, 10),
        typeAlign: ts.textAlign,
        typeOpacity: parseFloat(ts.opacity),
        typeMinW: parseFloat(ts.minWidth),
      };
    });
    expect(fieldScan).not.toBeNull();
    expect(fieldScan!.nameWeight).toBeGreaterThanOrEqual(500);
    expect(fieldScan!.typeAlign).toBe('right');
    expect(fieldScan!.typeOpacity).toBeLessThan(1);
    expect(fieldScan!.typeMinW).toBeGreaterThanOrEqual(40);
    // ADR-0016：默认关系线权重/对比（分享可读；ink900 + ≥2px）
    const shareEdgePath = page
      .getByTestId('share-relation-canvas')
      .locator('.react-flow__edge-path')
      .first();
    await expect(shareEdgePath).toBeVisible();
    const shareStroke = await shareEdgePath.evaluate((el) => {
      const s = getComputedStyle(el);
      return { stroke: s.stroke, width: parseFloat(s.strokeWidth) };
    });
    expect(shareStroke.stroke).toBe('rgb(11, 28, 44)'); // ink900
    expect(shareStroke.width).toBeGreaterThanOrEqual(2);
    expect(shareStroke.width).toBeLessThanOrEqual(2.5);
    await page.getByTestId('share-relation-canvas').screenshot({
      path: 'test-results/ux-walkthrough/demo-edge-stroke.png',
    });
    await page.getByTestId('share-relation-canvas').screenshot({
      path: 'test-results/ux-walkthrough/demo-table-header-hierarchy.png',
    });
    await page.getByTestId('share-relation-canvas').screenshot({
      path: 'test-results/ux-walkthrough/demo-field-scanability.png',
    });
    await page.getByTestId('share-relation-canvas').screenshot({
      path: 'test-results/ux-walkthrough/demo-edge-label-chip.png',
    });
    await page.getByTestId('share-relation-canvas').screenshot({
      path: 'test-results/ux-walkthrough/demo-edge-label-collision.png',
    });
    const chrome = page.getByTestId('share-chrome-header');
    await expect(chrome).toBeVisible();
    await expect(chrome.getByRole('button', { name: '复制到我的项目' })).toBeVisible();
    await expect(chrome.getByRole('link', { name: 'ERD Online 首页' })).toBeVisible();
    expect(await chrome.evaluate((el) => getComputedStyle(el).height)).toBe('64px');
    await page.screenshot({
      path: 'test-results/ux-walkthrough/demo-layout-density.png',
      fullPage: false,
    });
    await chrome.screenshot({
      path: 'test-results/ux-walkthrough/share-chrome-brand-demo.png',
    });
    await page.getByTestId('share-relation-canvas').screenshot({
      path: 'test-results/ux-walkthrough/demo-share-edge-routing.png',
    });
    // ADR-0017 / 0016：分享只读 Segmented 切多关系图（与设计器同 diagrams[]，无新建/重命名）
    const switcher = page.getByTestId('diagram-switcher');
    await expect(switcher).toBeVisible();
    await expect(switcher).toContainText('鉴权核心');
    const xMain = await page.getByTestId('rf__node-sys_user').evaluate((el) => {
      const m = (el as HTMLElement).style.transform.match(/translate\(([-\d.]+)px/);
      return m ? Number(m[1]) : NaN;
    });
    await switcher.scrollIntoViewIfNeeded();
    await switcher.getByText('会话与审计', { exact: true }).click();
    await expect(page.getByTestId('rf__node-sys_user')).toBeVisible({ timeout: 10_000 });
    const xAlt = await page.getByTestId('rf__node-sys_user').evaluate((el) => {
      const m = (el as HTMLElement).style.transform.match(/translate\(([-\d.]+)px/);
      return m ? Number(m[1]) : NaN;
    });
    expect(Number.isFinite(xMain) && Number.isFinite(xAlt)).toBeTruthy();
    expect(xAlt, `切图后 layout 应变（main=${xMain} alt=${xAlt}）`).not.toBe(xMain);
    await expect(page.getByTestId('diagram-frame').filter({ hasText: '会话审计' })).toBeVisible();
    await page.getByTestId('share-relation-canvas').screenshot({
      path: 'test-results/ux-walkthrough/demo-share-diagram-switch.png',
    });
    await page.screenshot({
      path: 'test-results/ux-walkthrough/demo-share-canvas-viewport.png',
      fullPage: false,
    });
    // ADR-0016：只读表清单默认折叠，底条展开 affordance；展开后可见清单区
    const tablesToggle = page.getByRole('button', { name: /展开表清单/ });
    await expect(tablesToggle).toBeVisible();
    await expect(tablesToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('share-tables-panel')).toHaveCount(0);
    await tablesToggle.click();
    await expect(page.getByRole('button', { name: '收起表清单' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    const tablesPanel = page.getByTestId('share-tables-panel');
    await expect(tablesPanel).toBeVisible();
    await expect(tablesPanel.getByRole('columnheader', { name: '表' })).toBeVisible();
    await expect(tablesPanel.getByRole('cell', { name: 'sys_user', exact: true })).toBeVisible();
    // ADR-0016：展开后行密度对齐 22–28 / project-list（禁 antd small 默认松行）
    const rowH = await tablesPanel
      .locator('.ant-table-tbody tr')
      .first()
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(rowH, `表清单行高应 ∈[22,28]，得 ${rowH}`).toBeGreaterThanOrEqual(22);
    expect(rowH, `表清单行高应 ∈[22,28]，得 ${rowH}`).toBeLessThanOrEqual(28);
    await page.screenshot({
      path: 'test-results/ux-walkthrough/demo-share-tables-dense.png',
      fullPage: false,
    });
  });
});
