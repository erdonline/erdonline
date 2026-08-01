import { expect, test } from '@playwright/test';
import { deleteAllPersonProjects, login } from './helpers';

/**
 * 版本快照零摩擦：无 JDBC 也能保存模型版本（北极星：有版本保存的活跃项目）。
 */
test.describe('版本快照', () => {
  test('无数据源也可新增版本并在列表可见', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = `ver-${Date.now()}`;
    try {
      await login(page);
      await deleteAllPersonProjects(page);

      await page.getByRole('button', { name: /新\s*建/ }).click();
      await page.getByPlaceholder('请输入项目名').fill(projectName);
      await page.locator('.ant-modal .ant-select').first().click();
      await page.locator('.ant-select-item-option', { hasText: '个人项目' }).click();
      await page.locator('.ant-modal .ant-select').nth(1).click();
      await page.keyboard.type('ver');
      await page.keyboard.press('Enter');
      await page.getByPlaceholder('请输入项目描述').fill('version snapshot');
      await page.locator('.ant-modal').getByRole('button', { name: /确\s*定/ }).click();
      await expect(page.getByText(projectName).first()).toBeVisible();
      await page.getByRole('button', { name: '打开模型' }).first().click();
      await expect(page).toHaveURL(/\/design\/table/, { timeout: 15_000 });

      // 顶栏：版本 → 版本管理（路由 ./design/version）
      await page.getByRole('menuitem', { name: '版本' }).click();
      await page.getByRole('link', { name: '版本管理' }).click();
      await expect(page).toHaveURL(/\/design\/table\/version\/all/, { timeout: 15_000 });
      await expect(page.getByText('Loading...')).toHaveCount(0);
      await expect(page.getByTestId('add-version-btn')).toBeVisible({ timeout: 15_000 });

      await page.getByTestId('add-version-btn').click();
      const modal = page.locator('.ant-modal:visible').last();
      await expect(modal.getByText('新增版本')).toBeVisible();
      await modal.getByRole('button', { name: /确\s*定/ }).click();
      await expect(page.locator('.ant-message')).toContainText(/保存成功/, { timeout: 15_000 });
      await expect(page.getByText('1.0.0').first()).toBeVisible({ timeout: 10_000 });
    } finally {
      await deleteAllPersonProjects(page).catch(() => {});
    }
  });
});
