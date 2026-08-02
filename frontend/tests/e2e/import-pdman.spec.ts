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
 * PdMan 导入：上传 minimal fixture → 同会话模型树可见
 */
test.describe('PdMan 导入', () => {
  test('上传 minimal-pdman.json 后模块与表可见', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('pdman');
    const fixture = path.join(__dirname, '../fixtures/minimal-pdman.json');

    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'pdman', 'pdman import');

      await page.getByRole('button', { name: '项目菜单' }).click();
      // 顶栏亦有「导入」menuitem；项目菜单用 panel + click（非 hover）
      await page
        .getByTestId('project-menu-panel')
        .getByRole('menuitem', { name: '导入' })
        .click();
      await page.getByRole('menuitem', { name: '解析PdMan文件' }).click();
      const dlg = page.getByRole('dialog');
      await expect(dlg.getByText('解析已有PdMan文件')).toBeVisible({ timeout: 10_000 });

      await dlg.locator('input[type="file"]').setInputFiles(fixture);
      await expectToast(page, /PdMan文件导入成功/);
      await dlg.getByRole('button', { name: /关\s*闭|取\s*消/ }).first().click().catch(() => {
        page.keyboard.press('Escape');
      });

      const tree = page.getByRole('complementary');
      await expect(tree.getByText('PdMan导入', { exact: true })).toBeVisible({
        timeout: 15_000,
      });
      await expandTreeTitle(page, 'PdMan导入');
      await expandTreeTitle(page, '表');
      await expect(tree.getByText('T_PD_ITEM', { exact: true })).toBeVisible({
        timeout: 10_000,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
