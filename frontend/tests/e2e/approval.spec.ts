import { expect, test } from '@playwright/test';
import { deleteAllPersonProjects, login } from './helpers';

/**
 * 工单/审批页可达与表头文案（防「我的审批」写成「我的工单」回归）。
 * 完整双账号审批链路记入手工清单。
 */
test.describe('版本工单/审批', () => {
  test('侧栏打开我的工单与我的审批，表头正确且有空态引导', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = `appr-${Date.now()}`;
    try {
      await login(page);
      await deleteAllPersonProjects(page);

      await page.getByRole('button', { name: /新\s*建/ }).click();
      await page.getByPlaceholder('请输入项目名').fill(projectName);
      await page.locator('.ant-modal .ant-select').first().click();
      await page.locator('.ant-select-item-option', { hasText: '个人项目' }).click();
      await page.locator('.ant-modal .ant-select').nth(1).click();
      await page.keyboard.type('ap');
      await page.keyboard.press('Enter');
      await page.getByPlaceholder('请输入项目描述').fill('approval pages');
      await page.locator('.ant-modal').getByRole('button', { name: /确\s*定/ }).click();
      await expect(page.getByText(projectName).first()).toBeVisible();
      await page.getByRole('button', { name: '打开模型' }).first().click();
      await expect(page).toHaveURL(/\/design\/table/, { timeout: 15_000 });

      await page.getByRole('menuitem', { name: '版本', exact: true }).click();
      await page.getByRole('link', { name: '我的工单' }).click();
      await expect(page).toHaveURL(/\/design\/table\/version\/order/, { timeout: 15_000 });
      await expect(page.locator('.ant-pro-table-list-toolbar-title')).toHaveText('我的工单');
      await expect(page.getByText(/暂无工单/)).toBeVisible();

      await page.getByRole('menuitem', { name: '版本', exact: true }).click();
      await page.getByRole('link', { name: '我的审批' }).click();
      await expect(page).toHaveURL(/\/design\/table\/version\/approval/, { timeout: 15_000 });
      await expect(page.locator('.ant-pro-table-list-toolbar-title')).toHaveText('我的审批');
      await expect(page.getByText(/暂无待审/)).toBeVisible();
    } finally {
      await deleteAllPersonProjects(page).catch(() => {});
    }
  });
});
