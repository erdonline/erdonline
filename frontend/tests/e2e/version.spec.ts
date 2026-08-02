import { expect, test } from '@playwright/test';
import {
  addFieldInline,
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  expectToast,
  gotoDesignModel,
  login,
  openRelationCanvas,
  openRelationFromEmpty,
  openVersionPage,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * 版本快照零摩擦 + 版本 diff 可视化
 * 定位：e2e-locators
 */

async function saveVersion(page: import('@playwright/test').Page) {
  await page.getByTestId('add-version-btn').click();
  const dialog = page.getByRole('dialog').filter({ hasText: '新增版本' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /确\s*定/ }).click();
  await expectToast(page, /保存成功/);
}

async function closeVersionDialog(
  page: import('@playwright/test').Page,
  title: string | RegExp,
) {
  const dialog = page.getByRole('dialog').filter({ hasText: title });
  await dialog.getByRole('button', { name: /Close|关闭/ }).click();
  await expect(dialog).toHaveCount(0);
}

test.describe('版本快照', () => {
  test('模型变更后详情展示可视化 diff（增删改着色）', async ({ page }) => {
    test.setTimeout(180_000);
    const projectName = uniqueProjectName('vdiff');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vdiff', 'version diff');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await page.waitForTimeout(2_000);

      await openVersionPage(page);
      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('version-change-summary').first()).toBeVisible({
        timeout: 5_000,
      });

      const row100 = page.getByTestId('version-row-1.0.0');
      await row100.hover();
      await row100.getByTestId('version-detail-btn').click();
      await expect(page.getByText('版本变更详情')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('version-diff-panel')).toBeVisible();
      await expect(page.getByTestId('version-diff-summary')).toBeVisible();
      await expect(page.getByTestId('version-diff-item-add').first()).toBeVisible();
      await expect(page.getByTestId('version-diff-panel')).toContainText('T_TABLE_1');
      await closeVersionDialog(page, '版本变更详情');

      await gotoDesignModel(page);
      await openRelationCanvas(page, '商城');
      await addFieldInline(page, 'T_TABLE_1', 'REMARK');
      await page.waitForTimeout(2_000);

      await openVersionPage(page);
      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.1')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('version-compare-btn')).toBeEnabled();
      await page.getByTestId('version-compare-btn').click();
      await expect(page.getByText('任意版本比较')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('version-diff-panel')).toBeVisible();
      await expect(page.getByTestId('version-diff-item-add').first()).toBeVisible();
      await expect(page.getByTestId('version-diff-panel')).toContainText(/REMARK|T_TABLE_1/);
      await closeVersionDialog(page, '任意版本比较');

      const v100 = page.getByTestId('version-row-1.0.0');
      await v100.hover();
      await v100.getByTestId('version-revert-btn').click();
      await page.getByRole('button', { name: '是' }).click();
      await expectToast(page, /成功回滚/);

      await gotoDesignModel(page);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await openRelationCanvas(page, '商城');
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(
        rfNode(page, 'T_TABLE_1').locator('.erd-field-name', { hasText: 'REMARK' }),
      ).toHaveCount(0, { timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('无数据源也可新增版本并在列表可见', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('ver');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'ver', 'version snapshot');
      await openVersionPage(page);
      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('version-compare-btn')).toBeDisabled();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('重命名描述与删除版本有 toast 且行消失', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('verdel');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'verdel', 'rename delete');
      await openVersionPage(page);

      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });

      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.1')).toBeVisible({ timeout: 10_000 });

      const row101 = page.getByTestId('version-row-1.0.1');
      await row101.hover();
      await row101.getByTestId('version-rename-btn').click();
      const renameDlg = page.getByRole('dialog').filter({ hasText: '编辑版本' });
      await expect(renameDlg).toBeVisible();
      await renameDlg.getByRole('textbox', { name: '版本描述' }).fill('E2E 重命名描述');
      await renameDlg.getByRole('button', { name: /确\s*定/ }).click();
      await expectToast(page, /版本信息更新成功/);
      await expect(renameDlg).toHaveCount(0, { timeout: 10_000 });
      await expect(row101.getByText('E2E 重命名描述')).toBeVisible({ timeout: 10_000 });

      const row100 = page.getByTestId('version-row-1.0.0');
      await row100.hover();
      await row100.getByTestId('version-delete-btn').click();
      await page.getByRole('button', { name: '是' }).click();
      await expectToast(page, /版本信息删除成功/);
      await expect(page.getByTestId('version-row-1.0.0')).toHaveCount(0, { timeout: 10_000 });
      await expect(page.getByTestId('version-row-1.0.1')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
