import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  addFieldInline,
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  login,
  openRelationFromEmpty,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * JExcel 工具栏「删除选中行」二次确认 Modal 键盘闭环
 * — 字段签选中行→「删除选中行」打开；首焦「删除」；Esc 关且归还触发器；Tab trap；取消不删
 */

async function assertFocusInside(dialog: Locator) {
  expect(
    await dialog.evaluate((dlg) => dlg.contains(document.activeElement)),
  ).toBe(true);
}

async function assertTabTrap(dialog: Locator, page: Page, presses = 8) {
  for (let i = 0; i < presses; i += 1) {
    await page.keyboard.press('Tab');
    await assertFocusInside(dialog);
  }
  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press('Shift+Tab');
    await assertFocusInside(dialog);
  }
}

test.describe('JExcel 工具栏删行确认弹层键盘', () => {
  test('删除选中行：首焦删除；Esc 归还；Tab trap；不删行', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('jxdel-kb');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'jxkb', 'jexcel toolbar delete keyboard');

      await openRelationFromEmpty(page);
      await page.getByRole('button', { name: '新建第一张表' }).click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await addFieldInline(page, 'T_TABLE_1', 'NAME');
      await node.getByTestId('canvas-open-field').evaluate((el: HTMLElement) => el.click());

      const fieldEdit = page.getByTestId('table-field-edit');
      await expect(fieldEdit).toBeVisible({ timeout: 10_000 });
      const nameCell = fieldEdit.getByRole('cell', { name: 'NAME' });
      await expect(nameCell).toBeVisible();
      await nameCell.click();

      const trigger = fieldEdit.getByRole('button', { name: '删除选中行' });
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-label', '删除选中行');
      await trigger.focus();
      await expect(trigger).toBeFocused();
      await trigger.click();

      const dialog = page.getByRole('dialog').filter({ hasText: /确定删除选定行/ });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByText(/不可逆/).filter({ visible: true })).toBeVisible();
      await expect(dialog.getByRole('button', { name: /删\s*除/ })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(dialog, page);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
      await expect(fieldEdit.getByRole('cell', { name: 'NAME' })).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
