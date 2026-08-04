import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  expectToast,
  login,
  openRelationFromEmpty,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * 只读分享（ADR-0007 / W2 / W5 / ADR-0016）：创建→复制→匿名可读；
 * 吊销/无效 → AuthBrandShell 失效门；空模块 → ER 剪影空态
 */
test.describe('只读分享', () => {
  test('无效 token 见品牌壳失效态并可打开示例 demo', async ({ page }) => {
    await page.goto(`/s/not-a-real-share-token-${Date.now().toString(36)}`);
    await expect(page.getByTestId('auth-brand-shell')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('auth-brand-panel')).toBeVisible();
    await expect(page.getByTestId('share-invalid-gate')).toBeVisible();
    await expect(page.getByRole('heading', { name: '分享不可用' })).toBeVisible();
    await expect(page.getByText(/分享不存在或已失效|分享已过期|分享链接无效|加载失败/)).toBeVisible();
    await expect(page.getByTestId('share-relation-canvas')).toHaveCount(0);
    await expect(page.getByRole('link', { name: '打开演示' }).first()).toBeVisible();

    const brandMetrics = await page.getByTestId('auth-brand-panel').evaluate((el) => {
      const cs = getComputedStyle(el);
      const root = getComputedStyle(document.documentElement);
      const form = document.querySelector('[data-testid="auth-form-panel"]') as HTMLElement | null;
      const header = document.querySelector('[data-testid="auth-form-header"]') as HTMLElement | null;
      const title = el.querySelector('.auth-shell__brand-title') as HTMLElement | null;
      const fcs = form ? getComputedStyle(form) : null;
      const hcs = header ? getComputedStyle(header) : null;
      const tcs = title ? getComputedStyle(title) : null;
      return {
        widthRatio: el.getBoundingClientRect().width / window.innerWidth,
        ink900: root.getPropertyValue('--erd-ink-900').trim(),
        bgImage: cs.backgroundImage,
        brandPadT: parseFloat(cs.paddingTop),
        brandPadL: parseFloat(cs.paddingLeft),
        brandGap: parseFloat(cs.gap) || 0,
        formPadT: fcs ? parseFloat(fcs.paddingTop) : -1,
        formPadL: fcs ? parseFloat(fcs.paddingLeft) : -1,
        headerMb: hcs ? parseFloat(hcs.marginBottom) : -1,
        titleSize: tcs ? parseFloat(tcs.fontSize) : 0,
      };
    });
    expect(brandMetrics.widthRatio).toBeGreaterThan(0.32);
    expect(brandMetrics.widthRatio).toBeLessThan(0.48);
    expect(brandMetrics.ink900).toBe('#0b1c2c');
    expect(brandMetrics.bgImage).toMatch(/linear-gradient/i);
    // ADR-0016：失效门碎距三压（与登录壳同源：gap12 / 门头 mb12）；品牌层次不弱化
    expect(brandMetrics.brandPadT, `品牌 padTop 应 ≤20，得 ${brandMetrics.brandPadT}`).toBeLessThanOrEqual(20);
    expect(brandMetrics.brandPadL, `品牌 padL 应 ≤16，得 ${brandMetrics.brandPadL}`).toBeLessThanOrEqual(16);
    expect(brandMetrics.brandGap, `品牌 gap 应 ∈[8,12]，得 ${brandMetrics.brandGap}`).toBeGreaterThanOrEqual(8);
    expect(brandMetrics.brandGap).toBeLessThanOrEqual(12);
    expect(brandMetrics.formPadT, `表单 padTop 应 ≤20，得 ${brandMetrics.formPadT}`).toBeLessThanOrEqual(20);
    expect(brandMetrics.formPadL, `表单 padL 应 ≤16，得 ${brandMetrics.formPadL}`).toBeLessThanOrEqual(16);
    expect(brandMetrics.headerMb, `门头 mb 应 ∈[8,12]，得 ${brandMetrics.headerMb}`).toBeGreaterThanOrEqual(8);
    expect(brandMetrics.headerMb).toBeLessThanOrEqual(12);
    expect(brandMetrics.titleSize).toBeGreaterThanOrEqual(24);

    await page.screenshot({
      path: 'test-results/ux-walkthrough/share-invalid-brand-shell.png',
      fullPage: false,
    });

    await page.getByRole('button', { name: '打开示例 demo' }).click();
    await expect(page).toHaveURL(/\/(demo|s\/public-demo)/, { timeout: 15_000 });
  });

  // ADR-0016：分享失效门键盘 — Skip 绕开品牌面板；主 CTA Tab 序；focus-visible；无 trap
  test('分享失效门键盘：Skip→主 CTA；Tab 序；focus-visible；无 trap', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.goto(`/s/not-a-real-share-kb-${Date.now().toString(36)}`);
    await expect(page.getByTestId('auth-brand-shell')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('share-invalid-gate')).toBeVisible();
    await expect(page.getByRole('heading', { name: '分享不可用' })).toBeVisible();
    await expect(page.getByTestId('auth-skip-form')).toHaveText('跳到主操作');
    await expect(page.getByTestId('share-invalid-gate')).toHaveAttribute('tabindex', '-1');

    await page.mouse.click(2, 2);
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('auth-skip-form')).toBeFocused({ timeout: 5_000 });
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('share-invalid-gate')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByTestId('share-invalid-gate')).not.toBeFocused();
    const primaryCta = page.getByRole('button', { name: '打开示例 demo' });
    await expect(primaryCta).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: '返回首页' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(primaryCta).toBeFocused();

    // focus-visible brand 环（须经 Tab 触发 :focus-visible）
    await page.getByRole('button', { name: '返回首页' }).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(primaryCta).toBeFocused();
    const ring = await primaryCta.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        outlineColor: cs.outlineColor,
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
      };
    });
    expect(ring.outlineStyle).not.toBe('none');
    expect(parseFloat(ring.outlineWidth)).toBeGreaterThanOrEqual(1);
    expect(ring.outlineColor).toMatch(/rgb\(\s*222,\s*41,\s*16\s*\)/);
  });

  test('空模块分享见 ER 剪影空态', async ({ page, browser }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('shareempty');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'share', 'empty share e2e');
      // 不建表：分享空模块

      const createRespPromise = page.waitForResponse(
        (r) => r.url().includes('/share/create') && r.request().method() === 'POST',
      );
      await page.getByRole('button', { name: '只读分享' }).click();
      const createResp = await createRespPromise;
      expect(createResp.ok()).toBeTruthy();
      const created = await createResp.json();
      expect(created.code).toBe(200);
      const token = created.data?.token as string;
      expect(token).toBeTruthy();

      const anon = await browser.newContext();
      const anonPage = await anon.newPage();
      try {
        await anonPage.goto(`/s/${token}`);
        await expect(anonPage.getByText(projectName).first()).toBeVisible({ timeout: 15_000 });
        await expect(anonPage.getByTestId('share-chrome-header')).toBeVisible();
        await expect(anonPage.getByTestId('share-empty-module')).toBeVisible();
        await expect(anonPage.getByTestId('erd-empty-diagram')).toBeVisible();
        await expect(anonPage.getByText(/该分享暂无模型|该模块暂无表/)).toBeVisible();
        await expect(anonPage.getByTestId('share-relation-canvas')).toHaveCount(0);
        await expect(anonPage.getByRole('button', { name: '打开示例 demo' })).toBeVisible();

        // ADR-0016：主标题 ink900/700 + hint muted；唯一实心主 CTA
        const empty = anonPage.getByTestId('share-empty-module');
        const shareEmptyMetrics = await empty.evaluate((el) => {
          const title = el.querySelector('.share-page__empty-title') as HTMLElement | null;
          const hint = el.querySelector('.share-page__empty-hint') as HTMLElement | null;
          const btn = el.querySelector('.ant-btn-primary') as HTMLElement | null;
          const tcs = title ? getComputedStyle(title) : null;
          const hcs = hint ? getComputedStyle(hint) : null;
          const bcs = btn ? getComputedStyle(btn) : null;
          return {
            titleColor: tcs?.color || '',
            titleWeight: tcs ? parseInt(tcs.fontWeight, 10) : 0,
            titleSize: tcs ? parseFloat(tcs.fontSize) : 0,
            hintColor: hcs?.color || '',
            hintSize: hcs ? parseFloat(hcs.fontSize) : 0,
            primaryCount: el.querySelectorAll('.ant-btn-primary').length,
            btnWeight: bcs ? parseInt(bcs.fontWeight, 10) : 0,
          };
        });
        expect(shareEmptyMetrics.titleColor).toBe('rgb(11, 28, 44)'); // ink900
        expect(shareEmptyMetrics.titleWeight).toBeGreaterThanOrEqual(700);
        expect(shareEmptyMetrics.titleSize).toBeLessThanOrEqual(14);
        expect(shareEmptyMetrics.hintColor).toBe('rgb(138, 151, 163)'); // ink400
        expect(shareEmptyMetrics.hintSize).toBeLessThanOrEqual(12);
        expect(shareEmptyMetrics.primaryCount).toBe(1);
        expect(shareEmptyMetrics.btnWeight).toBeGreaterThanOrEqual(600);

        await anonPage.screenshot({
          path: 'test-results/ux-walkthrough/share-empty-module.png',
          fullPage: false,
        });
      } finally {
        await anon.close();
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('设计器分享后匿名打开可见只读关系图', async ({ page, browser }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('share');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'share', 'share e2e');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      const createRespPromise = page.waitForResponse(
        (r) => r.url().includes('/share/create') && r.request().method() === 'POST',
      );
      await page.getByRole('button', { name: '只读分享' }).click();
      const createResp = await createRespPromise;
      expect(createResp.ok()).toBeTruthy();
      const created = await createResp.json();
      expect(created.code).toBe(200);
      const token = created.data?.token as string;
      expect(token).toBeTruthy();

      const dialog = page.getByRole('dialog', { name: '只读分享' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByLabel('分享链接')).toHaveValue(new RegExp(`/s/${token}$`));
      await dialog.getByRole('button', { name: '复制链接' }).click();
      await expectToast(page, /只读链接已复制|分享链接：/);

      const anon = await browser.newContext();
      const anonPage = await anon.newPage();
      try {
        await anonPage.goto(`/s/${token}`);
        await expect(anonPage.getByText(projectName).first()).toBeVisible({ timeout: 15_000 });
        // W5：分享顶栏对齐设计器壳（64px chrome + logo + Fork CTA + 登录/注册）
        const chrome = anonPage.getByTestId('share-chrome-header');
        await expect(chrome).toBeVisible();
        await expect(chrome.getByRole('link', { name: 'ERD Online 首页' })).toBeVisible();
        await expect(chrome.getByRole('button', { name: '复制到我的项目' })).toBeVisible();
        await expect(chrome.getByRole('link', { name: '登录' })).toBeVisible();
        await expect(chrome.getByRole('link', { name: '注册' })).toBeVisible();
        const headerH = await chrome.evaluate((el) => getComputedStyle(el).height);
        expect(headerH).toBe('64px');
        await expect(anonPage.getByTestId('share-relation-canvas')).toBeVisible();
        await expect(anonPage.getByText('T_TABLE_1').first()).toBeVisible();
        // ADR-0016：表清单默认折叠；展开后可见只读清单
        const tablesToggle = anonPage.getByRole('button', { name: /展开表清单/ });
        await expect(tablesToggle).toBeVisible();
        await expect(tablesToggle).toHaveAttribute('aria-expanded', 'false');
        await expect(anonPage.getByTestId('share-tables-panel')).toHaveCount(0);
        await tablesToggle.click();
        await expect(anonPage.getByTestId('share-tables-panel')).toBeVisible();
        await expect(
          anonPage.getByTestId('share-tables-panel').getByRole('cell', { name: 'T_TABLE_1' }),
        ).toBeVisible();
        const tablesDense = await anonPage.getByTestId('share-tables-panel').evaluate((el) => {
          const title = el.querySelector('.share-page__tables-title') as HTMLElement | null;
          const row = el.querySelector('.ant-table-tbody tr') as HTMLElement | null;
          return {
            padT: parseFloat(getComputedStyle(el).paddingTop),
            titleSize: title ? parseFloat(getComputedStyle(title).fontSize) : -1,
            rowH: row ? row.getBoundingClientRect().height : -1,
          };
        });
        expect(tablesDense.padT, `表清单 padTop 应 ≤6，得 ${tablesDense.padT}`).toBeLessThanOrEqual(6);
        expect(tablesDense.titleSize, `表清单标题应 ≤12，得 ${tablesDense.titleSize}`).toBeLessThanOrEqual(12);
        expect(tablesDense.rowH, `表清单行高应 ∈[20,26]，得 ${tablesDense.rowH}`).toBeGreaterThanOrEqual(20);
        expect(tablesDense.rowH, `表清单行高应 ∈[20,26]，得 ${tablesDense.rowH}`).toBeLessThanOrEqual(26);
        await anonPage.screenshot({
          path: 'test-results/ux-walkthrough/share-chrome-brand.png',
          fullPage: false,
        });
        await anonPage.getByRole('link', { name: '注册' }).click();
        await expect(anonPage).toHaveURL(/\/register\?redirect=/);
        await anonPage.goto(`/s/${token}`);
        await anonPage.getByRole('button', { name: '复制到我的项目' }).click();
        await expect(anonPage).toHaveURL(/\/login\?redirect=/);
        expect(decodeURIComponent(anonPage.url())).toContain('autofork=1');
        await expect(anonPage.getByRole('link', { name: '去注册' })).toBeVisible();
      } finally {
        await anon.close();
      }

      // 已登录 + autofork → 自动 fork 进设计器
      const forkRespPromise = page.waitForResponse(
        (r) => r.url().includes(`/share/${token}/fork`) && r.request().method() === 'POST',
      );
      await page.goto(`/s/${token}?autofork=1`);
      const forkResp = await forkRespPromise;
      expect(forkResp.ok()).toBeTruthy();
      const forked = await forkResp.json();
      expect(forked.code).toBe(200);
      expect(forked.data?.projectId).toBeTruthy();
      await expect(page).toHaveURL(new RegExp(`projectId=${forked.data.projectId}`), { timeout: 15_000 });
    } finally {
      // 失败路径也清：含 fork 副本；连跑两轮防残留
      await deleteOwnPersonProjects(page).catch(() => {});
      await deleteOwnPersonProjects(page).catch(() => {});
      await page.goto('/project/person');
      const escaped = projectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await expect(page.getByRole('link', { name: new RegExp(escaped) })).toHaveCount(0);
    }
  });

  test('创建→吊销后匿名链接失效', async ({ page, browser }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('sharerevoke');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'share', 'revoke e2e');

      const createRespPromise = page.waitForResponse(
        (r) => r.url().includes('/share/create') && r.request().method() === 'POST',
      );
      await page.getByRole('button', { name: '只读分享' }).click();
      const createResp = await createRespPromise;
      expect(createResp.ok()).toBeTruthy();
      const created = await createResp.json();
      expect(created.code).toBe(200);
      const token = created.data?.token as string;
      expect(token).toBeTruthy();

      const dialog = page.getByRole('dialog', { name: '只读分享' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByLabel('分享链接')).toHaveValue(new RegExp(`/s/${token}$`));
      await expect(dialog.getByRole('button', { name: '吊销分享' })).toBeEnabled();

      const revokeRespPromise = page.waitForResponse(
        (r) => r.url().includes('/share/revoke') && r.request().method() === 'POST',
      );
      await dialog.getByRole('button', { name: '吊销分享' }).click();
      const confirm = page.getByRole('dialog', { name: '确认吊销分享？' });
      await expect(confirm).toBeVisible();
      // antd 两字按钮 accessible name 常带空格（「吊 销」）
      await confirm.getByRole('button', { name: /吊\s*销/ }).click();
      const revokeResp = await revokeRespPromise;
      expect(revokeResp.ok()).toBeTruthy();
      const revoked = await revokeResp.json();
      expect(revoked.code).toBe(200);
      await expectToast(page, /分享已吊销/);

      const anon = await browser.newContext();
      const anonPage = await anon.newPage();
      try {
        await anonPage.goto(`/s/${token}`);
        await expect(anonPage.getByTestId('auth-brand-shell')).toBeVisible({ timeout: 15_000 });
        await expect(anonPage.getByTestId('share-invalid-gate')).toBeVisible();
        await expect(anonPage.getByRole('heading', { name: '分享不可用' })).toBeVisible();
        await expect(anonPage.getByText(/分享不存在或已失效|分享已过期|分享链接无效/)).toBeVisible();
        await expect(anonPage.getByTestId('share-relation-canvas')).toHaveCount(0);
        await expect(anonPage.getByRole('button', { name: '打开示例 demo' })).toBeVisible();
        await expect(anonPage.getByRole('button', { name: '返回首页' })).toBeVisible();
      } finally {
        await anon.close();
      }
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  // ADR-0016：分享壳键盘 — Skip 绕开顶栏；Controls 可达；MiniMap 出序；无 trap
  test('分享壳键盘：Skip→关系图；Controls 可达；MiniMap 出序；focus-visible', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/demo');
    await expect(page).toHaveURL(/\/s\/public-demo/);
    await expect(page.getByTestId('share-relation-canvas')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('share-skip-nav')).toBeAttached();
    await expect(page.getByTestId('share-skip-canvas')).toBeAttached();
    await expect(page.getByTestId('share-canvas-stage')).toHaveAttribute('tabindex', '-1');
    await expect(page.getByRole('button', { name: '复制到我的项目' })).toBeVisible();

    // 首项 Tab = Skip；Enter 落到画布地标
    await page.mouse.click(2, 2);
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('share-skip-canvas')).toBeFocused({ timeout: 5_000 });
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('share-canvas-stage')).toBeFocused();

    // 地标 → Tab 离开（无 trap）
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('share-canvas-stage')).not.toBeFocused();
    const afterStage = await page.evaluate(
      () =>
        (document.activeElement as HTMLElement | null)?.getAttribute('data-testid') ||
        (document.activeElement as HTMLElement | null)?.getAttribute('aria-label') ||
        (document.activeElement as HTMLElement | null)?.tagName ||
        '',
    );
    expect(afterStage).not.toBe('share-canvas-stage');
    expect(afterStage.length).toBeGreaterThan(0);

    // MiniMap 装饰出序；Controls 三钮（无「切换交互」）连续 Tab
    await expect(page.locator('.react-flow__minimap svg')).toHaveAttribute('tabindex', '-1');
    const zoomIn = page.getByRole('button', { name: '放大' });
    await zoomIn.focus();
    await expect(zoomIn).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: '缩小' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: '适应画布' })).toBeFocused();
    await page.keyboard.press('Tab');
    const afterControls = await page.evaluate(() => {
      const ae = document.activeElement as HTMLElement | null;
      if (!ae) return { inMinimap: false, label: '' };
      return {
        inMinimap: !!ae.closest('.react-flow__minimap'),
        label: ae.getAttribute('aria-label') || ae.getAttribute('data-testid') || ae.tagName,
      };
    });
    expect(afterControls.inMinimap, 'Tab 不得落入 MiniMap').toBe(false);
    expect(afterControls.label).not.toBe('');

    // Shift+Tab 回 Controls（无 trap）
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: '适应画布' })).toBeFocused();
    expect(
      await page.evaluate(() => !!document.activeElement?.closest('.react-flow__minimap')),
    ).toBe(false);

    // Controls focus-visible brand 环（须经 Tab 触发 :focus-visible）
    await page.getByRole('button', { name: '缩小' }).focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: '适应画布' })).toBeFocused();
    const ring = await page.getByRole('button', { name: '适应画布' }).evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        outlineColor: cs.outlineColor,
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
      };
    });
    expect(ring.outlineStyle).not.toBe('none');
    expect(parseFloat(ring.outlineWidth)).toBeGreaterThanOrEqual(1);
    expect(ring.outlineColor).toMatch(/rgb\(\s*222,\s*41,\s*16\s*\)/);

    // 切图条（若有）带键盘分组名
    const switcher = page.getByTestId('diagram-switcher');
    if ((await switcher.count()) > 0) {
      await expect(switcher).toHaveAttribute('aria-label', '切换关系图');
    }
  });
});
