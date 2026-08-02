import { expect, test } from '@playwright/test';
import path from 'path';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * DBML 导出：导入 fixture → 导出 → 下载内容含 Table / Ref
 */
test.describe('DBML 导出', () => {
  test('导入后导出下载 .dbml 含 Table 与 Ref', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('dbmlexp');
    const fixture = path.join(__dirname, '../fixtures/minimal.dbml');

    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'dbmlexp', 'dbml export');

      await page.getByRole('button', { name: '项目菜单' }).click();
      await page
        .getByTestId('project-menu-panel')
        .getByRole('menuitem', { name: '导入' })
        .click();
      await page.getByRole('button', { name: '导入DBML' }).click();
      const importDlg = page.getByRole('dialog');
      await expect(importDlg.getByText('导入 DBML')).toBeVisible({
        timeout: 10_000,
      });
      await importDlg.locator('input[type="file"]').setInputFiles(fixture);
      await expectToast(page, /DBML 导入成功/);
      await expect(importDlg).toBeHidden({ timeout: 10_000 });

      await page.getByRole('button', { name: '项目菜单' }).click();
      await page
        .getByTestId('project-menu-panel')
        .getByRole('menuitem', { name: '导出' })
        .click();
      await page.getByRole('button', { name: '导出DBML' }).click();

      const exportDlg = page.getByRole('dialog');
      await expect(exportDlg.getByText('导出 DBML')).toBeVisible({
        timeout: 10_000,
      });
      const preview = exportDlg.getByLabel('DBML预览');
      await expect(preview).toBeVisible();
      await expect
        .poll(async () => preview.inputValue(), { timeout: 15_000 })
        .toMatch(/Table\s+users/);
      const content = await preview.inputValue();
      expect(content).toMatch(/Table\s+posts/);
      expect(content).toMatch(/Ref:\s*posts\.user_id\s*>\s*users\.id/);

      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 15_000 }),
        exportDlg.getByRole('button', { name: '下载DBML' }).click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/\.dbml$/i);
      const dlPath = await download.path();
      expect(dlPath).toBeTruthy();
      const fs = await import('fs');
      const body = fs.readFileSync(dlPath!, 'utf8');
      expect(body).toMatch(/Table\s+users/);
      await expectToast(page, /已下载 DBML/);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
