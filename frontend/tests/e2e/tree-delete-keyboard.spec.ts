import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  expandTreeTitle,
  login,
  openRelationFromEmpty,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * 左树删除二次确认 Modal 键盘闭环
 * — 「表操作→删除表」打开；首焦「删除」；Esc 关且归还触发器；Tab trap；取消不删
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

test.describe('左树删除确认弹层键盘', () => {
  test('删除表：首焦删除；Esc 归还；Tab trap；不删表', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('treedel-kb');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'tdkb', 'tree delete keyboard');

      await openRelationFromEmpty(page, { name: 'M1', chnname: '模块一' });
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      await expandTreeTitle(page, '表');
      const tableItem = page.getByRole('treeitem').filter({ hasText: 'T_TABLE_1' });
      await expect(tableItem).toBeVisible({ timeout: 5_000 });

      const trigger = tableItem.getByLabel('表操作');
      await expect(trigger).toBeVisible();
      await trigger.click();
      await page.getByRole('menuitem', { name: '删除表' }).click();

      const dialog = page.getByRole('dialog').filter({ hasText: /确定删除表/ });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByText(/不可逆/).filter({ visible: true })).toBeVisible();
      await expect(dialog.getByRole('button', { name: /删\s*除/ })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(dialog, page);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();
      await expect(page.getByRole('tree').getByText('T_TABLE_1', { exact: true })).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
