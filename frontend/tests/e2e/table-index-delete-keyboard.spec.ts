import { expect, test, type Locator, type Page } from '@playwright/test';
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
 * 表设计索引签「删除索引」二次确认 Modal 键盘闭环
 * — 画布→索引→添加→「删除索引」打开；首焦「删除」；Esc 关且归还触发器；Tab trap；取消不删
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

test.describe('表设计删索引确认弹层键盘', () => {
  test('删除索引：首焦删除；Esc 归还；Tab trap；不删索引', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('idxdel-kb');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'idkb', 'index delete keyboard');

      await openRelationFromEmpty(page);
      await page.getByRole('button', { name: '新建第一张表' }).click();
      const node = rfNode(page, 'T_TABLE_1');
      await expect(node).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('save-status')).toHaveText('已落盘', { timeout: 15_000 });

      await node.getByTestId('canvas-open-index').evaluate((el: HTMLElement) => el.click());
      const indexEdit = page.getByTestId('table-index-edit');
      await indexEdit.getByRole('button', { name: '添加第一个索引' }).click();
      await expectToast(page, '索引更新成功');
      await expect(indexEdit.getByRole('cell', { name: 'T_TABLE_1_IDX1' })).toBeVisible();

      const trigger = indexEdit.getByRole('button', { name: '删除索引 T_TABLE_1_IDX1' });
      await expect(trigger).toBeVisible();
      await trigger.focus();
      await expect(trigger).toBeFocused();
      await trigger.click();

      const dialog = page.getByRole('dialog').filter({ hasText: /确定删除索引/ });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByText(/不可逆/).filter({ visible: true })).toBeVisible();
      await expect(dialog.getByRole('button', { name: /删\s*除/ })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(dialog, page);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
      await expect(indexEdit.getByRole('cell', { name: 'T_TABLE_1_IDX1' })).toBeVisible();
      await expect(indexEdit.getByTestId('index-empty-add')).toHaveCount(0);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
