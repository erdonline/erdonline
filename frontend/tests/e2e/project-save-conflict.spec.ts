import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  login,
  openRelationFromEmpty,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * ADR-0022：project 乐观锁 — 409 不得静默成功，须可行动 UI。
 */
test.describe('project/save 乐观锁冲突', () => {
  test('409 → 冲突 Modal + 顶栏冲突态', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('saveconflict');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'conflict', '409 actionable');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible({ timeout: 25_000 });
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 25_000 });
      await page.waitForTimeout(1_500);

      await page.route('**/ncnb/project/save', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 409,
            msg: '项目已被其他窗口或协作者更新，请刷新后再保存',
            data: null,
          }),
        });
      });

      await page.getByTestId('canvas-create-table').click();
      await expect(page.getByRole('dialog', { name: '保存冲突' })).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByTestId('project-save-conflict-modal')).toBeVisible();
      await expect(page.getByTestId('project-save-conflict-preview')).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.getByTestId('version-diff-panel')).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId('save-status')).toHaveText('保存冲突，点击查看选项');
      await expect(page.getByTestId('save-status')).not.toHaveText('已落盘');
    } finally {
      await page.unroute('**/ncnb/project/save').catch(() => {});
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
