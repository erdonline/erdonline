import { expect, test } from '@playwright/test';
import { deleteAllPersonProjects, login } from './helpers';

/**
 * 项目激活链路：
 * 1. 空态引导（无项目时提示创建 + 一键示例）
 * 2. 新建表单默认值（个人项目 / 标签已填，仅需输入名称）
 * 3. 创建成功有反馈
 */
test.describe('项目激活', () => {
  test('个人项目空态引导新建与一键示例', async ({ page }) => {
    test.setTimeout(120_000);
    try {
      await login(page);
      await deleteAllPersonProjects(page);
      await page.goto('/project/person');
      await expect(page.getByTestId('person-empty-create')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('person-empty-example')).toBeVisible();

      // 空态一键示例：跳转设计器，模型树展开可见示例表
      await page.getByTestId('person-empty-example').click();
      await expect(page).toHaveURL(/\/design\/table\/model\?projectId=/, { timeout: 15_000 });
      await expect(page.locator('.ant-tree')).toContainText('示例商城', { timeout: 15_000 });
      const expand = async (title: string) => {
        const n = page
          .locator('.ant-tree-treenode', { has: page.getByText(title, { exact: true }) })
          .first();
        await n.locator('.ant-tree-switcher').first().click();
        await page.waitForTimeout(300);
      };
      await expand('示例商城');
      await expand('表');
      await expect(page.locator('.ant-tree')).toContainText('T_USER', { timeout: 10_000 });
      await expect(page.locator('.ant-tree')).toContainText('T_ORDER');
    } finally {
      await deleteAllPersonProjects(page).catch(() => {});
    }
  });

  test('新建项目表单默认值且创建成功有反馈', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = `act-${Date.now()}`;
    try {
      await login(page);
      await deleteAllPersonProjects(page);
      await page.goto('/project/person');
      await page.getByTestId('project-create-trigger').click();

      // 项目类型默认已选「个人项目」
      const typeSelect = page.locator('.ant-modal .ant-form-item').filter({ hasText: '项目类型' });
      await expect(typeSelect.locator('.ant-select-selection-item')).toHaveText('个人项目');

      // 仅需填项目名与描述，标签已有默认值
      await page.getByPlaceholder('请输入项目名').fill(projectName);
      await page.getByPlaceholder('请输入项目描述').fill('activation test');
      await page.locator('.ant-modal').getByRole('button', { name: /确\s*定/ }).click();

      await expect(page.getByText('创建成功')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(projectName).first()).toBeVisible({ timeout: 10_000 });
    } finally {
      await deleteAllPersonProjects(page).catch(() => {});
    }
  });
});
