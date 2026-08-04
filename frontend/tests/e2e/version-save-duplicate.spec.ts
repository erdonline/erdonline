import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  openVersionPage,
  uniqueProjectName,
} from './helpers';

/**
 * ADR-0022：db_change 版本号唯一 — 409001 须可行动 Modal，不静默失败。
 */
test.describe('版本号冲突可行动提示', () => {
  test('409001 → 版本号冲突 Modal', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('ver-dup-ui');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vdup', 'version duplicate ui');
      await openVersionPage(page);

      await page.route('**/ncnb/hisProject/save', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 409001,
            msg: '该版本号已被占用，请改用更大的版本号或刷新版本列表后重试',
          }),
        });
      });

      await page.getByTestId('add-version-btn').click();

      const dialog = page.getByRole('dialog', { name: '新增版本' });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await dialog.getByRole('textbox', { name: '版本号' }).fill('2.0.0');
      await dialog.getByRole('textbox', { name: '版本描述' }).fill('dup test');
      await dialog.getByRole('button', { name: /确\s*定/ }).click();

      const conflict = page.getByRole('dialog', { name: '版本号冲突' });
      await expect(conflict).toBeVisible({ timeout: 10_000 });
      await expect(conflict.getByText(/已被其他窗口或协作者占用/)).toBeVisible();
      await conflict.getByRole('button', { name: '刷新版本列表' }).click();
      await expect(conflict).toHaveCount(0, { timeout: 10_000 });
    } finally {
      await page.unroute('**/ncnb/hisProject/save').catch(() => {});
      await deleteOwnPersonProjects(page);
    }
  });
});
