import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * 设计器「默认项设置」Modal 键盘闭环
 * — 打开首焦「默认字段」Tab；Esc 关；焦点归还「项目菜单」；Tab trap 在 dialog
 */

async function assertFocusInside(dialog: Locator) {
  expect(
    await dialog.evaluate((dlg) => dlg.contains(document.activeElement)),
  ).toBe(true);
}

async function assertTabTrap(dialog: Locator, page: Page, presses = 12) {
  for (let i = 0; i < presses; i += 1) {
    await page.keyboard.press('Tab');
    await assertFocusInside(dialog);
  }
  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press('Shift+Tab');
    await assertFocusInside(dialog);
  }
}

test.describe('默认项设置弹层键盘', () => {
  test('默认项设置：首焦默认字段；Esc 归还；Tab trap', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('def-kb');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'defkb', 'default keyboard');

      const menuTrigger = page.getByRole('button', { name: '项目菜单' });
      await menuTrigger.click();
      await page
        .getByTestId('project-menu-panel')
        .getByRole('menuitem', { name: '设置' })
        .click();
      await page.getByRole('menuitem', { name: '默认项设置' }).click();

      const dialog = page.getByRole('dialog', { name: '默认项设置' });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByRole('tab', { name: '默认字段' })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(dialog, page);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(menuTrigger).toBeFocused({ timeout: 5_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
