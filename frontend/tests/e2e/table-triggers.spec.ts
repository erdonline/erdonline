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
 * 表设计「触发器」签：列表 + 查看 DDL + 添加/删除（persist-on-200）
 * — locators：role / aria / testid；禁止 .ant-*
 */
test.describe('表设计触发器签', () => {
  test('打开触发器签：添加 → 查看 DDL → 删除', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('trg-ui');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'trg', 'table triggers ui');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await node.getByTestId('canvas-open-trigger').evaluate((el: HTMLElement) => el.click());
      const designer = page.getByTestId('table-design');
      await expect(designer).toBeVisible({ timeout: 10_000 });
      await expect(designer.getByRole('tab', { name: '触发器' })).toHaveAttribute(
        'aria-selected',
        'true',
      );

      const triggerEdit = page.getByTestId('table-trigger-edit');
      await expect(triggerEdit).toBeVisible();
      await expect(triggerEdit.getByTestId('trigger-empty-hint')).toBeVisible();

      await triggerEdit.getByRole('button', { name: '添加第一个触发器' }).click();
      const addDialog = page.getByRole('dialog', { name: '添加触发器' });
      await expect(addDialog).toBeVisible();
      await addDialog.getByLabel('触发器名称').fill('trg_user_bu');
      await addDialog.getByLabel('触发器语句体').fill('SET NEW.updated_at = NOW()');
      await addDialog.getByRole('button', { name: '确认添加触发器' }).click();

      await expectToast(page, '触发器更新成功');
      await expect(triggerEdit.getByRole('option', { name: '查看触发器 trg_user_bu' })).toBeVisible();
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await triggerEdit.getByRole('option', { name: '查看触发器 trg_user_bu' }).click();
      const ddl = triggerEdit.getByTestId('trigger-ddl-panel');
      await expect(ddl).toBeVisible();
      await expect(triggerEdit.getByTestId('trigger-ddl-body')).toContainText('CREATE TRIGGER');
      await expect(triggerEdit.getByTestId('trigger-ddl-body')).toContainText('trg_user_bu');
      await expect(triggerEdit.getByTestId('trigger-statement')).toContainText(
        'SET NEW.updated_at = NOW()',
      );

      await triggerEdit.getByRole('button', { name: '删除触发器 trg_user_bu' }).click();
      const delDialog = page.getByRole('dialog').filter({ hasText: /确定删除触发器/ });
      await expect(delDialog).toBeVisible();
      await delDialog.getByRole('button', { name: /删\s*除/ }).click();
      await expectToast(page, '触发器更新成功');
      await expect(triggerEdit.getByTestId('trigger-empty-add')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
