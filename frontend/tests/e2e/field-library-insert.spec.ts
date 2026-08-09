import { expect, test } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  expectToast,
  login,
  openRelationFromEmpty,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * ADR-0032：字段库 copy-on-apply — 平台「性别」插入表设计字段签
 */
test.describe('字段库插入', () => {
  test.describe.configure({ retries: 1 });

  test('从字段库插入平台性别字段并落盘', async ({ page }) => {
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

      await fieldEdit.getByTestId('field-library-insert-open').click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByTestId('field-library-tree')).toBeVisible();
      await dialog.getByTestId('field-library-search').fill('性别');
      await dialog.getByTestId('field-library-search').press('Enter');
      await dialog.getByRole('treeitem', { name: /性别/ }).click();
      await dialog.getByTestId('field-library-insert-confirm').click();
      await expectToast(page, /已插入|插入字段/);

      await expect(fieldEdit.getByRole('cell', { name: 'gender', exact: true })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
