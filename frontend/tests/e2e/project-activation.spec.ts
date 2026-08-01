import { expect, test } from '@playwright/test';
import { deleteAllPersonProjects, login, withExclusiveAccount } from './helpers';

/**
 * 项目激活链路（账号级空态，走 chromium-serial + withExclusiveAccount）
 */
test.describe('项目激活', () => {
  test.describe.configure({ mode: 'serial' });

  test('个人项目空态引导新建与一键示例', async ({ page }) => {
    test.setTimeout(120_000);
    await withExclusiveAccount(async () => {
      try {
        await login(page);
        await deleteAllPersonProjects(page);
        await page.goto('/project/person');
        await expect(page.getByTestId('person-empty-create')).toBeVisible({ timeout: 10_000 });
        await expect(page.getByTestId('person-empty-example')).toBeVisible();

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
  });

  test('新建项目表单默认值且创建成功有反馈', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = `act-${Date.now()}`;
    await withExclusiveAccount(async () => {
      try {
        await login(page);
        await deleteAllPersonProjects(page);
        await page.goto('/project/person');
        await page.getByTestId('project-create-trigger').click();

        const typeSelect = page.locator('.ant-modal .ant-form-item').filter({ hasText: '项目类型' });
        await expect(typeSelect.locator('.ant-select-selection-item')).toHaveText('个人项目');

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
});
