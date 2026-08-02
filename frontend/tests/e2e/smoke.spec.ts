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
      const shellHtml = shell?.outerHTML ?? '';
      return {
        widthRatio: el.getBoundingClientRect().width / window.innerWidth,
        bgImage: cs.backgroundImage,
        ink900: root.getPropertyValue('--erd-ink-900').trim(),
        shellHasBg2: /bg2\.png/i.test(shellHtml),
        shellHas1677: /#1677FF/i.test(shellHtml),
      };
    });
    expect(brandMetrics.widthRatio).toBeGreaterThan(0.32);
    expect(brandMetrics.widthRatio).toBeLessThan(0.48);
    expect(brandMetrics.bgImage).not.toMatch(/bg2\.png/i);
    expect(brandMetrics.shellHasBg2).toBe(false);
    expect(brandMetrics.shellHas1677).toBe(false);
    expect(brandMetrics.ink900).toBe('#0b1c2c');

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
