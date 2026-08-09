import { expect, test } from '@playwright/test';
import {
  addFieldInline,
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  expectToast,
  login,
  openRelationFromEmpty,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * ADR-0032：字段库 copy-on-apply — 表设计 JExcel 工具栏写入 + 覆盖
 */
test.describe('字段库写入', () => {
  test.describe.configure({ retries: 1 });

  test('从字段库追加平台性别字段并落盘', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('fieldlib');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fieldlib', 'field library e2e');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      await node.getByTestId('canvas-open-field').evaluate((el: HTMLElement) => el.click());
      const fieldEdit = page.getByTestId('table-field-edit');
      await expect(fieldEdit).toBeVisible({ timeout: 10_000 });

      const toolbar = fieldEdit.getByRole('toolbar', { name: '表格编辑工具栏' });
      await expect(toolbar.getByTestId('field-library-insert-open')).toBeVisible();
      await toolbar.getByRole('button', { name: '从字段库写入' }).click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByTestId('field-library-mode-hint')).toContainText(/追加/);
      await expect(dialog.getByTestId('field-library-tree')).toBeVisible();
      await dialog.getByTestId('field-library-search').fill('性别');
      await dialog.getByTestId('field-library-search').press('Enter');
      await dialog.getByRole('treeitem', { name: /性别/ }).click();
      await dialog.getByTestId('field-library-insert-confirm').click();
      await expectToast(page, /已写入|写入字段/);

      await expect(fieldEdit.getByRole('cell', { name: 'gender', exact: true })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('选中行后从字段库覆盖字段并落盘', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('fieldlib-ow');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'fieldlibow', 'field library overwrite e2e');
      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      await addFieldInline(page, 'T_TABLE_1', 'PLACEHOLDER');
      await node.getByTestId('canvas-open-field').evaluate((el: HTMLElement) => el.click());
      const fieldEdit = page.getByTestId('table-field-edit');
      await expect(fieldEdit).toBeVisible({ timeout: 10_000 });

      const placeholderCell = fieldEdit.getByRole('cell', { name: 'PLACEHOLDER' });
      await expect(placeholderCell).toBeVisible();
      await placeholderCell.click();

      const toolbar = fieldEdit.getByRole('toolbar', { name: '表格编辑工具栏' });
      await toolbar.getByRole('button', { name: '从字段库写入' }).click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByTestId('field-library-mode-hint')).toContainText(/覆盖/);
      await dialog.getByTestId('field-library-search').fill('性别');
      await dialog.getByTestId('field-library-search').press('Enter');
      await dialog.getByRole('treeitem', { name: /性别/ }).click();
      await dialog.getByRole('button', { name: '覆盖' }).click();
      await expectToast(page, /已覆盖/);

      await expect(fieldEdit.getByRole('cell', { name: 'gender', exact: true })).toBeVisible({
        timeout: 15_000,
      });
      await expect(fieldEdit.getByRole('cell', { name: 'PLACEHOLDER' })).toHaveCount(0);
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
