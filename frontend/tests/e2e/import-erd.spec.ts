import { expect, test } from '@playwright/test';
import path from 'path';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  expandTreeTitle,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * ERD 导入：上传 AES 加密 minimal fixture → 同会话模型树可见
 */
test.describe('ERD 导入', () => {
  test('上传 minimal.erd.json 后模块与表可见', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('erdimp');
    const fixture = path.join(__dirname, '../fixtures/minimal.erd.json');

    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'erdimp', 'erd import');

      await page.getByRole('button', { name: '项目菜单' }).click();
      // 顶栏亦有「导入」menuitem；项目菜单用 panel + click（非 hover）
      await page
        .getByTestId('project-menu-panel')
        .getByRole('menuitem', { name: '导入' })
        .click();
      await page.getByRole('button', { name: '解析ERD文件' }).click();
      const dlg = page.getByRole('dialog');
      await expect(dlg.getByText('解析已有ERD文件')).toBeVisible({ timeout: 10_000 });

      await dlg.locator('input[type="file"]').setInputFiles(fixture);
      await expectToast(page, /ERD文件导入成功/);
      await dlg.getByRole('button', { name: /关\s*闭|取\s*消/ }).first().click().catch(() => {
        page.keyboard.press('Escape');
      });

      const tree = page.getByRole('complementary');
      await expect(tree.getByText('ERD导入', { exact: true })).toBeVisible({
        timeout: 15_000,
      });
      await expandTreeTitle(page, 'ERD导入');
      await expandTreeTitle(page, '表');
      await expect(tree.getByText('T_ERD_ITEM', { exact: true })).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
