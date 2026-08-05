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
    // ADR-0016：meta / 表清单次密 → 画布吃满顶栏下视口
    const meta = page.getByTestId('share-page-meta');
    await expect(meta).toBeVisible();
    await expect(meta.getByText(/匿名只读/)).toBeVisible();
    const densify = await meta.evaluate((el) => {
      const stage = el.closest('.share-page__stage') as HTMLElement | null;
      const hint = el.querySelector('.share-page__hint') as HTMLElement | null;
      const cs = getComputedStyle(el);
      const stageCs = stage ? getComputedStyle(stage) : null;
      const hintCs = hint ? getComputedStyle(hint) : null;
      return {
        metaH: el.getBoundingClientRect().height,
        metaGap: parseFloat(cs.gap) || 0,
        stagePadT: stageCs ? parseFloat(stageCs.paddingTop) : -1,
        hintLh: hintCs ? parseFloat(hintCs.lineHeight) : -1,
      };
    });
    expect(densify.metaH, `share meta 高应 ≤60（含切图条），得 ${densify.metaH}`).toBeLessThanOrEqual(60);
    expect(densify.metaGap, `meta gap 应 ≤2，得 ${densify.metaGap}`).toBeLessThanOrEqual(2);
    expect(densify.stagePadT, `stage padTop 应 ≤6，得 ${densify.stagePadT}`).toBeLessThanOrEqual(6);
    expect(densify.hintLh, `hint lh 应 ≤16，得 ${densify.hintLh}`).toBeLessThanOrEqual(16);
    const canvasH = await page.getByTestId('share-relation-canvas').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return {h: r.height, top: r.top};
    });
    const vh = await page.evaluate(() => window.innerHeight);
    expect(canvasH.h, `画布高应 >480，得 ${canvasH.h}`).toBeGreaterThan(480);
    expect(canvasH.h, `画布应占视口过半，得 ${canvasH.h}/${vh}`).toBeGreaterThan(vh * 0.5);
    // meta 收紧后画布应更接近视口主导（禁 hint/描述松距抢高）
    expect(canvasH.h, `画布应 ≥视口 55%，得 ${canvasH.h}/${vh}`).toBeGreaterThanOrEqual(vh * 0.55);
    // 底边折叠条常驻（~28px）；画布下缘贴条上方而非贴死视口底
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
    // ADR-0016：Frame 标题扫读（label 12/700 vs muted meta；chrome ≤22）
    const frameLook = await page
      .getByTestId('diagram-frame')
      .filter({ hasText: 'RBAC' })
      .locator('.erd-frame-chrome')
      .evaluate((el) => {
        const label = el.querySelector('.erd-frame-label');
        const meta = el.querySelector('.erd-frame-meta');
        if (!label || !meta) return null;
        const cs = getComputedStyle(el);
        const ls = getComputedStyle(label);
        const ms = getComputedStyle(meta);
        return {
          chromeH: parseFloat(cs.height),
          padX: parseFloat(cs.paddingLeft),
          labelSize: parseFloat(ls.fontSize),
          labelWeight: parseInt(ls.fontWeight, 10),
          labelText: (label.textContent || '').trim(),
          metaSize: parseFloat(ms.fontSize),
          metaWeight: parseInt(ms.fontWeight, 10),
          metaOpacity: parseFloat(ms.opacity),
        };
      });
    expect(frameLook).not.toBeNull();
    expect(frameLook!.labelText).toBe('RBAC');
    expect(frameLook!.chromeH, `Frame chrome 应 ≤22px，得 ${frameLook!.chromeH}`).toBeLessThanOrEqual(22);
    expect(frameLook!.chromeH).toBeGreaterThanOrEqual(18);
    expect(frameLook!.padX).toBeGreaterThanOrEqual(8);
    expect(frameLook!.labelSize).toBeGreaterThanOrEqual(12);
    expect(frameLook!.labelWeight).toBeGreaterThanOrEqual(700);
    expect(frameLook!.metaSize).toBeLessThan(frameLook!.labelSize);
    expect(frameLook!.metaWeight).toBeLessThan(frameLook!.labelWeight);
    expect(frameLook!.metaOpacity).toBeLessThan(1);
    // MiniMap：sunk 底 + 128×96 + panel margin 8（禁 RF 默认 15 / #fff）
    const mini = await page.getByRole('img', { name: '画布缩略图' }).evaluate((svg) => {
      const el = (svg.closest('.react-flow__minimap') || svg.parentElement) as HTMLElement;
      const cs = getComputedStyle(el);
      return {
        bg: cs.backgroundColor,
        w: parseFloat(cs.width),
        h: parseFloat(cs.height),
        marginBottom: parseFloat(cs.marginBottom),
        marginRight: parseFloat(cs.marginRight),
      };
    });
    expect(mini.bg).toBe('rgb(250, 251, 252)'); // surfaceSunk
    expect(mini.w, `MiniMap 宽应 ≤128，得 ${mini.w}`).toBeLessThanOrEqual(128);
    expect(mini.h, `MiniMap 高应 ≤96，得 ${mini.h}`).toBeLessThanOrEqual(96);
    expect(mini.marginBottom, `MiniMap marginB 应 ≈8∈[8,12]，得 ${mini.marginBottom}`).toBeGreaterThanOrEqual(8);
    expect(mini.marginBottom).toBeLessThanOrEqual(12);
    expect(mini.marginRight).toBeGreaterThanOrEqual(8);
    expect(mini.marginRight).toBeLessThanOrEqual(12);
    // Controls：surface + 密按钮 + panel margin 8；适应画布为主操作
    const ctrl = await page.getByRole('button', { name: '适应画布' }).evaluate((fitBtn) => {
      const el = fitBtn.closest('.react-flow__controls') as HTMLElement | null;
      if (!el) return null;
      const cs = getComputedStyle(el);
      const btn = el.querySelector('.react-flow__controls-button');
      const fit = el.querySelector('.erd-controls-primary');
      const bs = btn ? getComputedStyle(btn) : null;
      const fs = fit ? getComputedStyle(fit) : null;
      return {
        bg: cs.backgroundColor,
        marginBottom: parseFloat(cs.marginBottom),
        marginLeft: parseFloat(cs.marginLeft),
        btnH: bs ? parseFloat(bs.height) : NaN,
        fitColor: fs?.color ?? '',
        fitBg: fs?.backgroundColor ?? '',
      };
    });
    expect(ctrl).toBeTruthy();
    expect(ctrl!.bg).toBe('rgb(255, 255, 255)'); // --erd-surface
    expect(ctrl!.bg).not.toBe('rgb(254, 254, 254)');
    expect(
      ctrl!.marginBottom,
      `Controls marginB 应 ≈8∈[8,12]，得 ${ctrl!.marginBottom}`,
    ).toBeGreaterThanOrEqual(8);
    expect(ctrl!.marginBottom).toBeLessThanOrEqual(12);
    expect(ctrl!.marginLeft).toBeGreaterThanOrEqual(8);
    expect(ctrl!.marginLeft).toBeLessThanOrEqual(12);
    expect(ctrl!.btnH, `Controls 按钮高应 ≤22，得 ${ctrl!.btnH}`).toBeLessThanOrEqual(
      22,
    );
    expect(ctrl!.fitColor).toBe('rgb(11, 28, 44)'); // ink900
    expect(ctrl!.fitBg).toBe('rgb(243, 245, 247)'); // surface-muted
    await page.getByTestId('share-relation-canvas').screenshot({
      path: 'test-results/ux-walkthrough/demo-frame-theme-tokens.png',
    });
    await page
      .getByTestId('diagram-frame')
      .filter({ hasText: 'RBAC' })
      .screenshot({
        path: 'test-results/ux-walkthrough/demo-frame-title-hierarchy.png',
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
      expect(m).toMatch(/^(default|centerX|bypass|twoBend|astar|sameSide)$/);
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
    // ADR-0016：分享只读同 SCSS — 表头实体名主标题 vs 中文 meta；密度 pad ≤6
    const shareUser = page
      .getByTestId('share-relation-canvas')
      .getByTestId('rf__node-sys_user');
    await expect(shareUser).toBeVisible();
    const headerHierarchy = await shareUser.locator('.erd-table-header').evaluate((el) => {
      const title = el.querySelector('.erd-table-title');
      const chn = el.querySelector('.erd-table-chnname');
      if (!title || !chn) return null;
      const hs = getComputedStyle(el);
      const ts = getComputedStyle(title);
      const cs = getComputedStyle(chn);
      return {
        padTop: parseFloat(hs.paddingTop),
        padBottom: parseFloat(hs.paddingBottom),
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
    expect(headerHierarchy!.padTop).toBeLessThanOrEqual(6);
    expect(headerHierarchy!.padBottom).toBeLessThanOrEqual(6);
    expect(headerHierarchy!.titleSize).toBeGreaterThanOrEqual(14);
    expect(headerHierarchy!.titleWeight).toBeGreaterThanOrEqual(700);
    expect(headerHierarchy!.titleColor).toBe('rgb(11, 28, 44)'); // ink900
    expect(headerHierarchy!.chnSize).toBeLessThan(headerHierarchy!.titleSize);
    expect(headerHierarchy!.chnWeight).toBeLessThan(headerHierarchy!.titleWeight);
    expect(headerHierarchy!.chnOpacity).toBeLessThan(1);
    // ADR-0016：分享只读同 SCSS — 字段行密度 + 名主列 / 类型次要栏
    const shareField = shareUser.locator('.erd-field-row').first();
    await expect(shareField).toBeVisible();
    const fieldScan = await shareField.evaluate((el) => {
      const name = el.querySelector('.erd-field-name');
      const type = el.querySelector('.erd-field-type');
      if (!name || !type) return null;
      const rs = getComputedStyle(el);
      const ns = getComputedStyle(name);
      const ts = getComputedStyle(type);
      return {
        minH: parseFloat(rs.minHeight),
        lineH: parseFloat(rs.lineHeight),
        padTop: parseFloat(rs.paddingTop),
        nameWeight: parseInt(ns.fontWeight, 10),
        typeAlign: ts.textAlign,
        typeOpacity: parseFloat(ts.opacity),
        typeMinW: parseFloat(ts.minWidth),
      };
    });
    expect(fieldScan).not.toBeNull();
    expect(fieldScan!.minH).toBe(20);
    expect(fieldScan!.lineH).toBe(15);
    expect(fieldScan!.padTop).toBe(1);
    expect(fieldScan!.nameWeight).toBeGreaterThanOrEqual(500);
    expect(fieldScan!.typeAlign).toBe('right');
    expect(fieldScan!.typeOpacity).toBeLessThan(1);
    expect(fieldScan!.typeMinW).toBeGreaterThanOrEqual(40);
    // ADR-0016：分享只读同 SCSS — PK/FK 徽章角色标列扫读
    const sharePk = shareUser.locator('[data-field="id"] .erd-pk-badge.active');
    await expect(sharePk).toBeVisible();
    const sharePkLook = await sharePk.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        fontSize: parseFloat(s.fontSize),
        fontWeight: parseInt(s.fontWeight, 10),
        minW: parseFloat(s.minWidth),
        color: s.color,
      };
    });
    expect(sharePkLook.fontSize).toBeGreaterThanOrEqual(10);
    expect(sharePkLook.fontWeight).toBeGreaterThanOrEqual(700);
    expect(sharePkLook.minW).toBeGreaterThanOrEqual(22);
    expect(sharePkLook.color).toBe('rgb(212, 136, 6)'); // warning
    const shareFkRow = page
      .getByTestId('share-relation-canvas')
      .getByTestId('rf__node-sys_user_role')
      .locator('[data-field="user_id"]');
    await expect(shareFkRow.locator('.erd-fk-badge')).toBeVisible();
    const shareFkLook = await shareFkRow.locator('.erd-fk-badge').evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        fontSize: parseFloat(s.fontSize),
        fontWeight: parseInt(s.fontWeight, 10),
        minW: parseFloat(s.minWidth),
        color: s.color,
      };
    });
    expect(shareFkLook.fontSize).toBe(sharePkLook.fontSize);
    expect(shareFkLook.fontWeight).toBeGreaterThanOrEqual(700);
    expect(shareFkLook.minW).toBeGreaterThanOrEqual(22);
    expect(shareFkLook.color).toBe('rgb(47, 143, 123)'); // success
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
      path: 'test-results/ux-walkthrough/demo-table-node-density.png',
    });
    await page.getByTestId('share-relation-canvas').screenshot({
      path: 'test-results/ux-walkthrough/demo-field-scanability.png',
    });
    await page.getByTestId('share-relation-canvas').screenshot({
      path: 'test-results/ux-walkthrough/demo-pk-fk-badge-hierarchy.png',
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
    // 表清单分页：demo 8 表 / 默认 pageSize 5 → 可见分页；第 2 页见 biz_order
    await expect(tablesPanel.getByText('共 8 张表')).toBeVisible();
    const page2 = tablesPanel.getByRole('listitem', { name: '2' });
    await expect(page2).toBeVisible();
    await expect(tablesPanel.getByRole('cell', { name: 'biz_order', exact: true })).toHaveCount(0);
    await page2.click();
    await expect(tablesPanel.getByRole('cell', { name: 'biz_order', exact: true })).toBeVisible();
    await expect(tablesPanel.getByRole('cell', { name: 'sys_user', exact: true })).toHaveCount(0);
    // ADR-0016：表清单次密 — panel pad≤6 / 标题 12 / 行 ∈20–26
    const tablesDense = await tablesPanel.evaluate((el) => {
      const title = el.querySelector('.share-page__tables-title') as HTMLElement | null;
      const cell = el.querySelector('.ant-table-tbody td') as HTMLElement | null;
      const row = el.querySelector('.ant-table-tbody tr') as HTMLElement | null;
      const cs = getComputedStyle(el);
      return {
        padT: parseFloat(cs.paddingTop),
        padX: parseFloat(cs.paddingLeft),
        titleSize: title ? parseFloat(getComputedStyle(title).fontSize) : -1,
        titleMb: title ? parseFloat(getComputedStyle(title).marginBottom) : -1,
        cellPadT: cell ? parseFloat(getComputedStyle(cell).paddingTop) : -1,
        rowH: row ? row.getBoundingClientRect().height : -1,
      };
    });
    expect(tablesDense.padT, `表清单 padTop 应 ≤6，得 ${tablesDense.padT}`).toBeLessThanOrEqual(6);
    expect(tablesDense.padX, `表清单 padX 应 ≤10，得 ${tablesDense.padX}`).toBeLessThanOrEqual(10);
    expect(tablesDense.titleSize, `表清单标题应 ≤12，得 ${tablesDense.titleSize}`).toBeLessThanOrEqual(12);
    expect(tablesDense.titleMb, `表清单标题 mb 应 ≤4，得 ${tablesDense.titleMb}`).toBeLessThanOrEqual(4);
    expect(tablesDense.cellPadT, `表单元 padTop 应 ≤3，得 ${tablesDense.cellPadT}`).toBeLessThanOrEqual(3);
    expect(tablesDense.rowH, `表清单行高应 ∈[20,26]，得 ${tablesDense.rowH}`).toBeGreaterThanOrEqual(20);
    expect(tablesDense.rowH, `表清单行高应 ∈[20,26]，得 ${tablesDense.rowH}`).toBeLessThanOrEqual(26);
    await page.screenshot({
      path: 'test-results/ux-walkthrough/demo-share-tables-dense.png',
      fullPage: false,
    });
  });

  test('public-demo LocaleSwitcher 切换英文文案', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/s/public-demo');
    await expect(page.getByTestId('share-relation-canvas')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('功能鉴权示例').first()).toBeVisible();

    await page.getByTestId('locale-switcher').click();
    await page.getByRole('option', { name: 'English' }).click();

    await expect(page.getByText('AuthZ Demo').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('diagram-frame').filter({ hasText: 'Subject' })).toBeVisible();
    await expect(page.getByTestId('diagram-frame').filter({ hasText: 'Session & Audit' })).toBeVisible();
    await expect(page.getByTestId('rf__node-sys_user').locator('.erd-table-chnname')).toHaveText('User');
    await expect(page.getByTestId('diagram-switcher')).toContainText('Auth Core');

    const tablesToggle = page.getByRole('button', { name: /Show table list/i });
    await tablesToggle.click();
    await expect(page.getByText('8 tables total')).toBeVisible();
    await expect(page.getByTestId('diagram-frame').filter({ hasText: 'RBAC' }).getByText('4 tables')).toBeVisible();
  });
});
