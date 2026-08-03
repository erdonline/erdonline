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
 * 画布删字段二次确认 Modal 键盘闭环
 * — 字段浏览器 ×「删除字段」打开；首焦「删除」；Esc 关且归还触发器；Tab trap；取消不删
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

test.describe('画布删字段确认弹层键盘', () => {
  test('× 打开：首焦删除；Esc 归还；Tab trap；不删字段', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('cfdel-kb');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'cfkb', 'canvas field delete keyboard');

      await openRelationFromEmpty(page);
      await page.getByRole('button', { name: '新建第一张表' }).click();
      const table = rfNode(page, 'T_TABLE_1');
      await expect(table).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });

      await addFieldInline(page, 'T_TABLE_1', 'NAME');
      const nameRow = table.locator('[data-field="NAME"]');
      await expect(nameRow).toBeVisible();

      await nameRow.hover();
      const trigger = nameRow.getByRole('button', { name: '删除字段' });
      await expect(trigger).toBeVisible();
      // 右柄常挡 × 的命中盒；与 relation「删除字段」一致用 DOM click，先 focus 保触发器归还
      await trigger.focus();
      await expect(trigger).toBeFocused();
      await trigger.evaluate((el: HTMLElement) => el.click());

      const dialog = page.getByRole('dialog').filter({ hasText: /确定删除字段/ });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByText(/不可逆/).filter({ visible: true })).toBeVisible();
      await expect(dialog.getByRole('button', { name: /删\s*除/ })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(dialog, page);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
      await expect(nameRow).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
