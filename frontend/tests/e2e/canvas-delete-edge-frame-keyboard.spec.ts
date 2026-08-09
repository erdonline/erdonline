import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  addFieldInline,
  addEntityViaTreeFolder,
  connectFields,
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  login,
  openRelationFromEmpty,
  rfNode,
  selectRelationEdge,
  uniqueProjectName,
} from './helpers';

/**
 * 画布删边 / 删分组二次确认 Modal 键盘闭环
 * — Delete 打开；首焦「删除」；Esc 关且归还触发器；Tab trap；不真正删除
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

test.describe('画布删边/删分组确认弹层键盘', () => {
  test('删边：首焦删除；Esc 归还；Tab trap；不删边', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('cvedge-kb');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'cekb', 'canvas edge delete keyboard');

      await openRelationFromEmpty(page);
      await page.getByRole('button', { name: '新建第一张表' }).click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible({ timeout: 10_000 });

      await addEntityViaTreeFolder(page);
      await page.getByTestId('entity-modal-name').fill('T_ORDER');
      await page.getByTestId('entity-modal-ok').click();
      await expect(rfNode(page, 'T_ORDER')).toBeVisible();

      await addFieldInline(page, 'T_ORDER', 'USER_ID', 'IdOrKey');
      await connectFields(page, 'T_ORDER', 'USER_ID', 'T_TABLE_1', 'id');
      await expect(page.locator('.react-flow__edge')).toHaveCount(1);

      await selectRelationEdge(page);
      const trigger = page.getByTestId('erd-edge-label').first();
      await expect(trigger).toBeFocused();

      await page.keyboard.press('Delete');

      const dialog = page.getByRole('dialog').filter({ hasText: /确定删除关系/ });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByText(/不可逆/).filter({ visible: true })).toBeVisible();
      await expect(dialog.getByRole('button', { name: /删\s*除/ })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(dialog, page);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
      await expect(page.locator('.react-flow__edge')).toHaveCount(1);
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('删分组：首焦删除；Esc 归还；Tab trap；不删框', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('cvframe-kb');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'cfkb', 'canvas frame delete keyboard');

      await openRelationFromEmpty(page);
      await page.getByRole('button', { name: '新建第一张表' }).click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible({ timeout: 10_000 });

      await page.getByRole('button', { name: '命令' }).click();
      await expect(page.getByRole('dialog', { name: '命令面板' })).toBeVisible();
      await page.getByTestId('cmd-palette-input').fill('新建');
      await page.getByRole('option', { name: /新建表/ }).click();
      await expect(rfNode(page, 'T_TABLE_2')).toBeVisible({ timeout: 10_000 });

      await rfNode(page, 'T_TABLE_1').click();
      await rfNode(page, 'T_TABLE_2').click({ modifiers: ['Shift'] });
      await page.getByRole('button', { name: '新建分组' }).click();
      const frame = page.getByTestId('diagram-frame');
      await expect(frame).toBeVisible({ timeout: 10_000 });

      // 点框选中后聚焦稳定触发器再 Delete
      await page.locator('.react-flow__node-frame').click({ position: { x: 16, y: 12 }, force: true });
      await expect(page.getByRole('button', { name: '适应成员' })).toBeVisible({ timeout: 5_000 });
      const trigger = page.getByTestId('frame-rename-label');
      await trigger.focus();
      await expect(trigger).toBeFocused();

      await page.keyboard.press('Delete');

      const dialog = page.getByRole('dialog').filter({ hasText: /确定删除分组/ });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByText(/仅删除分组框/).filter({ visible: true })).toBeVisible();
      await expect(dialog.getByRole('button', { name: /删\s*除/ })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(dialog, page);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
      await expect(frame).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
