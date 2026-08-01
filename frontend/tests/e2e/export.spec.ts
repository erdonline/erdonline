import { test, expect } from '@playwright/test';
import { login, deleteAllPersonProjects } from './helpers';

/**
 * 导出去 G6：Markdown 导出走 DOM+html2canvas（relation2file），
 * 断言能产出 .md 下载（空模块走「未绘制关系图」分支亦可）。
 */
test.describe('导出（无 G6）', () => {
  test('普通导出 Markdown 成功下载', async ({ page }) => {
    await login(page);
    await deleteAllPersonProjects(page);

    await page.getByRole('button', { name: /新\s*建/ }).click();
    const projectName = `export-${Date.now()}`;
    await page.getByPlaceholder('请输入项目名').fill(projectName);
    await page.locator('.ant-modal .ant-select').first().click();
    await page.locator('.ant-select-item-option', { hasText: '个人项目' }).click();
    await page.locator('.ant-modal .ant-select').nth(1).click();
    await page.keyboard.type('export');
    await page.keyboard.press('Enter');
    await page.getByPlaceholder('请输入项目描述').fill('export test');
    await page.locator('.ant-modal').getByRole('button', { name: /确\s*定|提\s*交|保\s*存/ }).click();
    await expect(page.getByText(projectName).first()).toBeVisible();
    await page.getByRole('button', { name: '打开模型' }).first().click();
    await expect(page).toHaveURL(/\/design\/table/, { timeout: 15_000 });

    try {
      await page.goto(`/design/table/export/common`);
      await expect(page.getByText('导出文件')).toBeVisible({ timeout: 15_000 });

      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 30_000 }),
        page.getByText('导出Markdown').click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/\.md$/i);
      expect(await download.path()).toBeTruthy();
    } finally {
      try {
        await deleteAllPersonProjects(page);
      } catch { /* ignore */ }
    }
  });
});
