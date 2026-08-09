import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  expectToast,
  expandTreeTitle,
  login,
  openRelationFromEmpty,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * 核心旅程冒烟（第 0 轮验证基建）
 * 定位：e2e-locators（role / testid）
 */

test.describe('冒烟：核心旅程', () => {
  test('登录页渲染；错误凭证停留在登录页', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('auth-brand-shell')).toBeVisible();
    await expect(page.getByTestId('auth-brand-panel')).toBeVisible();
    await expect(page.getByRole('textbox', { name: '用户名' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: '密码' })).toBeVisible();
    await expect(page.getByText(/Git \+ Figma/).first()).toBeVisible();
    await expect(page.getByRole('link', { name: '打开演示' }).first()).toBeVisible();
    await expect(page.getByText(/ChatGPT/i)).toHaveCount(0);

    // W5：左品牌面板 ~40%；无 bg2 / Ant 蓝硬编码
    const brandMetrics = await page.getByTestId('auth-brand-panel').evaluate((el) => {
      const cs = getComputedStyle(el);
      const root = getComputedStyle(document.documentElement);
      const shell = document.querySelector('[data-testid="auth-brand-shell"]');
      const form = document.querySelector('[data-testid="auth-form-panel"]') as HTMLElement | null;
      const header = document.querySelector('[data-testid="auth-form-header"]') as HTMLElement | null;
      const formTitle = header?.querySelector('.auth-shell__form-title') as HTMLElement | null;
      const shellForm = document.querySelector('[data-testid="auth-shell-form"]') as HTMLElement | null;
      const formItem = shellForm?.querySelector('.ant-form-item') as HTMLElement | null;
      const input = shellForm?.querySelector(
        '.ant-input:not([disabled]):not(textarea)',
      ) as HTMLElement | null;
      const btn = shellForm?.querySelector('.ant-btn-primary') as HTMLElement | null;
      const title = el.querySelector('.auth-shell__brand-title') as HTMLElement | null;
      const thumb = el.querySelector('.auth-shell__brand-thumb') as HTMLElement | null;
      const hero = el.querySelector('.auth-shell__brand-hero') as HTMLImageElement | null;
      const kicker = el.querySelector('[data-testid="auth-brand-kicker"]') as HTMLElement | null;
      const fcs = form ? getComputedStyle(form) : null;
      const hcs = header ? getComputedStyle(header) : null;
      const ftCs = formTitle ? getComputedStyle(formTitle) : null;
      const itemCs = formItem ? getComputedStyle(formItem) : null;
      const ics = input ? getComputedStyle(input) : null;
      const bcs = btn ? getComputedStyle(btn) : null;
      const tcs = title ? getComputedStyle(title) : null;
      const thCs = thumb ? getComputedStyle(thumb) : null;
      const shellHtml = shell?.outerHTML ?? '';
      return {
        widthRatio: el.getBoundingClientRect().width / window.innerWidth,
        bgImage: cs.backgroundImage,
        ink900: root.getPropertyValue('--erd-ink-900').trim(),
        shellHasBg2: /bg2\.png/i.test(shellHtml),
        shellHas1677: /#1677FF/i.test(shellHtml),
        brandPadT: parseFloat(cs.paddingTop),
        brandPadL: parseFloat(cs.paddingLeft),
        brandGap: parseFloat(cs.gap) || 0,
        formPadT: fcs ? parseFloat(fcs.paddingTop) : -1,
        formPadL: fcs ? parseFloat(fcs.paddingLeft) : -1,
        headerMb: hcs ? parseFloat(hcs.marginBottom) : -1,
        formTitleMt: ftCs ? parseFloat(ftCs.marginTop) : -1,
        itemMb: itemCs ? parseFloat(itemCs.marginBottom) : -1,
        inputH: ics ? parseFloat(ics.height) : -1,
        btnH: bcs ? parseFloat(bcs.height) : -1,
        titleSize: tcs ? parseFloat(tcs.fontSize) : 0,
        thumbPad: thCs ? parseFloat(thCs.paddingTop) : -1,
        heroW: hero ? parseFloat(hero.getAttribute('width') || '0') : 0,
        heroSrc: hero?.getAttribute('src') || '',
        voidBg: root.getPropertyValue('--erd-void').trim(),
        kickerVisible: !!kicker,
      };
    });
    expect(brandMetrics.widthRatio).toBeGreaterThan(0.32);
    expect(brandMetrics.widthRatio).toBeLessThan(0.48);
    expect(brandMetrics.bgImage).not.toMatch(/bg2\.png/i);
    expect(brandMetrics.shellHasBg2).toBe(false);
    expect(brandMetrics.shellHas1677).toBe(false);
    expect(brandMetrics.ink900).toBe('#0b1c2c');
    expect(brandMetrics.voidBg).toBe('#070d14');
    // ADR-0016：登录门碎距 — pad 20×16 + gap12 + 门头 mb12；表单 Title mt6 / 项 mb12 / 控件 28
    expect(brandMetrics.brandPadT, `品牌 padTop 应 ≤20，得 ${brandMetrics.brandPadT}`).toBeLessThanOrEqual(20);
    expect(brandMetrics.brandPadL, `品牌 padL 应 ≤16，得 ${brandMetrics.brandPadL}`).toBeLessThanOrEqual(16);
    expect(brandMetrics.brandPadT).toBeGreaterThanOrEqual(16);
    expect(brandMetrics.brandGap, `品牌 gap 应 ∈[8,12]，得 ${brandMetrics.brandGap}`).toBeGreaterThanOrEqual(8);
    expect(brandMetrics.brandGap).toBeLessThanOrEqual(12);
    expect(brandMetrics.formPadT, `表单 padTop 应 ≤20，得 ${brandMetrics.formPadT}`).toBeLessThanOrEqual(20);
    expect(brandMetrics.formPadL, `表单 padL 应 ≤16，得 ${brandMetrics.formPadL}`).toBeLessThanOrEqual(16);
    expect(brandMetrics.headerMb, `门头 mb 应 ∈[8,12]，得 ${brandMetrics.headerMb}`).toBeGreaterThanOrEqual(8);
    expect(brandMetrics.headerMb).toBeLessThanOrEqual(12);
    expect(brandMetrics.formTitleMt, `表单 Title mt 应 ≤8（禁 mt10），得 ${brandMetrics.formTitleMt}`).toBeLessThanOrEqual(8);
    expect(brandMetrics.formTitleMt).toBeGreaterThanOrEqual(4);
    expect(brandMetrics.itemMb, `表单项 mb 应 ∈[8,16]（目标12），得 ${brandMetrics.itemMb}`).toBeGreaterThanOrEqual(8);
    expect(brandMetrics.itemMb).toBeLessThanOrEqual(16);
    expect(brandMetrics.inputH, `Input 高应 ∈[24,32]（目标28），得 ${brandMetrics.inputH}`).toBeGreaterThanOrEqual(24);
    expect(brandMetrics.inputH).toBeLessThanOrEqual(32);
    expect(brandMetrics.btnH, `提交钮高应 ∈[24,32]（目标28），得 ${brandMetrics.btnH}`).toBeGreaterThanOrEqual(24);
    expect(brandMetrics.btnH).toBeLessThanOrEqual(32);
    // 全站 ConfigProvider：登录主钮 = brand（禁 antd 默认蓝）
    const loginBtnBg = await page.getByTestId('login-submit').evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    expect(loginBtnBg).toMatch(/rgb\(\s*222,\s*41,\s*16\s*\)/);
    expect(brandMetrics.titleSize).toBeGreaterThanOrEqual(24);
    expect(brandMetrics.thumbPad).toBeLessThanOrEqual(14);
    // ADR-0026：精密营销壳 — kicker + landing hero 窗（非剪影 SVG）
    expect(brandMetrics.kickerVisible).toBe(true);
    expect(brandMetrics.heroSrc).toMatch(/landing-hero\.jpg/);
    expect(brandMetrics.heroW, `hero 窗宽应 ≤280，得 ${brandMetrics.heroW}`).toBeLessThanOrEqual(280);
    expect(brandMetrics.heroW).toBeGreaterThan(200);

    await page.getByRole('textbox', { name: '用户名' }).fill('nobody');
    await page.getByRole('textbox', { name: '密码' }).fill('wrong-pass');
    await page.getByRole('button', { name: /登\s*录/ }).click();

    await page.waitForTimeout(3_000);
    await expect(page).toHaveURL(/\/login/);
  });

  test('错误凭证登录出现明确错误提示', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: '用户名' }).fill('nobody');
    await page.getByRole('textbox', { name: '密码' }).fill('wrong-pass');
    await page.getByRole('button', { name: /登\s*录/ }).click();
    await expectToast(page, '查无此用户');
    await expect(page.getByText('查无此用户')).toHaveCount(1);
  });

  test('登录 → 新建项目 → 进入设计器', async ({ page }) => {
    await login(page);
    await deleteOwnPersonProjects(page);
    const projectName = uniqueProjectName('smoke');
    await createAndOpenPersonProject(page, projectName, 'smoke', 'smoke test project');
    await deleteOwnPersonProjects(page);
    await expect(page.getByText(projectName)).toHaveCount(0);
  });

  test('模型树删除表需二次确认（取消不删）', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('del');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'del', 'delete confirm');
      await openRelationFromEmpty(page, { name: 'M1', chnname: '模块一' });
      await page.getByTestId('canvas-empty-create').click();
      await expect(page.getByText('T_TABLE_1').first()).toBeVisible();

      await expandTreeTitle(page, '表');
      await expect(page.getByRole('tree').getByText('T_TABLE_1', { exact: true })).toBeVisible({
        timeout: 5_000,
      });
      await page.getByLabel('表操作').click();
      await page.getByRole('menuitem', { name: '删除表' }).click();
      const dialog = page.getByRole('dialog');
      // Modal.confirm 会有一份隐藏的 ant-modal-title，只断言可见文案
      await expect(dialog.getByText(/确定删除表/).filter({ visible: true })).toBeVisible();
      await expect(dialog.getByText(/不可逆/).filter({ visible: true })).toBeVisible();
      // antd 中文 locale 常把按钮渲染成「删 除」
      await expect(dialog.getByRole('button', { name: /删\s*除/ })).toBeVisible();
      await dialog.getByRole('button', { name: /取\s*消/ }).click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('模型树删除表确认后移除并提示成功', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('delok');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'delok', 'delete ok');
      await openRelationFromEmpty(page, { name: 'M1', chnname: '模块一' });
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      await expandTreeTitle(page, '表');
      await page.getByLabel('表操作').click();
      await page.getByRole('menuitem', { name: '删除表' }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByText(/不可逆/)).toBeVisible();
      await dialog.getByRole('button', { name: /删\s*除/ }).click();
      await expectToast(page, '表删除成功');
      await expect(page.getByRole('tree').getByText('T_TABLE_1', { exact: true })).toHaveCount(0);
      await expect(rfNode(page, 'T_TABLE_1')).toHaveCount(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
