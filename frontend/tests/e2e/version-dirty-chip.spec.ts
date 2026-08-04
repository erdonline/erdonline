import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  gotoDesignModel,
  login,
  openRelationFromEmpty,
  openVersionPage,
  rfNode,
  saveVersion,
  uniqueProjectName,
} from './helpers';

/**
 * A 层 dirty chip（ADR-0022 切片 2）：顶栏实时呈现工作区 ↔ 最新版本基线。
 * 定位：e2e-locators（data-testid / role）
 */

test.describe('顶栏版本 dirty chip', () => {
  test('尚无版本 → 编辑后摘要 → 存版后一致 → 再改未存版本', async ({ page }) => {
    test.setTimeout(150_000);
    const projectName = uniqueProjectName('vchip');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vchip', 'version dirty chip');

      const noBaselineChip = page.getByTestId('version-dirty-chip-no-baseline');
      await expect(noBaselineChip).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('version-dirty-chip-clean')).toHaveCount(0);

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      // 无基线时仍走「尚无版本」，但可带 +N 变更摘要
      await expect(noBaselineChip).toBeVisible({ timeout: 15_000 });
      await expect(noBaselineChip).toContainText('+');

      await openVersionPage(page);
      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });

      await gotoDesignModel(page);
      await expect(page.getByTestId('version-dirty-chip-clean')).toBeVisible({ timeout: 15_000 });

      // 有基线后再改模型 → 「未存版本」
      await page.getByTestId('tree-open-relation').click();
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 15_000 });
      await page.getByTestId('canvas-create-table').click();
      await expect(rfNode(page, 'T_TABLE_2')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('version-dirty-chip-dirty')).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId('version-dirty-chip-dirty')).toContainText('+');

      // SaveStatus 仍只管落盘，与 dirty chip 分离
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
