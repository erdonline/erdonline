import { expect, test } from '@playwright/test';
import {
  addFieldInline,
  addEntityViaTreeFolder,
  connectFields,
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
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
      await expect(noBaselineChip).toHaveText('v—');

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
      await expect(page.getByTestId('version-dirty-chip-dirty')).toHaveText('v*');

      // SaveStatus 仍只管落盘，与 dirty chip 分离
      await expect(page.getByTestId('save-status')).toHaveText(/已落盘|已同步/, {
        timeout: 15_000,
      });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('存版后改 profile 默认字段 → dirty chip 未存版本', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('vchip-prof');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vchipp', 'dirty chip profile');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await openVersionPage(page);
      await saveVersion(page);
      await gotoDesignModel(page);
      await expect(page.getByTestId('version-dirty-chip-clean')).toBeVisible({ timeout: 15_000 });

      const projectId = new URL(page.url()).searchParams.get('projectId');
      expect(projectId).toBeTruthy();
      await page.goto(`/design/table/setting/defaultField?projectId=${projectId}`);
      const sheet = page.getByTestId('default-field-page');
      await expect(sheet).toBeVisible({ timeout: 15_000 });
      const idCell = sheet.getByText('id', { exact: true }).first();
      await idCell.dblclick();
      await page.keyboard.type('e2e_pk');
      await page.keyboard.press('Enter');
      await expectToast(page, '默认字段已更新');
      await gotoDesignModel(page);
      await expect(page.getByTestId('version-dirty-chip-dirty')).toBeVisible({ timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('存版后画布连线 → dirty chip 未存版本', async ({ page }) => {
    test.setTimeout(150_000);
    const projectName = uniqueProjectName('vchip-assoc');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vchipa', 'dirty chip assoc');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await openVersionPage(page);
      await saveVersion(page);
      await gotoDesignModel(page);
      await expect(page.getByTestId('version-dirty-chip-clean')).toBeVisible({ timeout: 15_000 });

      await page.getByTestId('tree-open-relation').click();
      await expect(page.getByTestId('reactflow-canvas')).toBeVisible({ timeout: 15_000 });
      await addEntityViaTreeFolder(page);
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-ok').click();
      await expect(rfNode(page, 'T_ORDER')).toBeVisible({ timeout: 15_000 });
      await addFieldInline(page, 'T_ORDER', 'USER_ID', 'IdOrKey');
      await expect(page.getByTestId('save-status')).toHaveText(/已落盘|已同步/, {
        timeout: 15_000,
      });
      await connectFields(page, 'T_ORDER', 'USER_ID', 'T_TABLE_1', 'id');
      await expect(page.getByTestId('version-dirty-chip-dirty')).toBeVisible({ timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
