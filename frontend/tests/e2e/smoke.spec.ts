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
    await expect(page.getByRole('textbox', { name: '用户名' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: '密码' })).toBeVisible();
    await expect(page.getByText(/Git \+ Figma/)).toBeVisible();
    await expect(page.getByRole('button', { name: '打开演示' })).toBeVisible();
    await expect(page.getByText(/ChatGPT/i)).toHaveCount(0);

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
      await expect(dialog.getByText(/确定删除表/)).toBeVisible();
      await dialog.getByRole('button', { name: /取\s*消/ }).click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
