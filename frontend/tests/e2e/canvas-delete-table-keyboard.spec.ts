import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  login,
  openRelationFromEmpty,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * 画布删表二次确认 Modal 键盘闭环
 * — RF 选中表 → Delete 打开；首焦「删除」；Esc 关且归还触发器；Tab trap；取消不删
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

test.describe('画布删表确认弹层键盘', () => {
  test('首焦删除；Esc 归还；Tab trap；不删表', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('cvdel-kb');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'cdkb', 'canvas delete keyboard');

      await openRelationFromEmpty(page);
      await page.getByRole('button', { name: '新建第一张表' }).click();
      const table = rfNode(page, 'T_TABLE_1');
      await expect(table).toBeVisible({ timeout: 10_000 });

      // 选中表头（勿双击进改名）；焦点落稳定触发器再 Delete
      await page.locator('.react-flow__pane').click({ position: { x: 8, y: 8 }, force: true });
      await table.locator('.erd-table-title').click();
      await expect(table).toHaveClass(/selected/);
      const trigger = table.getByRole('button', { name: '修改表名' });
      await trigger.focus();
      await expect(trigger).toBeFocused();

      await page.keyboard.press('Delete');

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
      await expect(table).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
