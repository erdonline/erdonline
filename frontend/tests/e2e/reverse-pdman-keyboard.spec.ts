import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * 设计器「解析PdMan文件」Modal 键盘闭环
 * — 打开首焦上传区；Esc 关；焦点归还「项目菜单」；Tab trap 在 dialog
 * — 不依赖真实 PdMan 文件内容；仅走菜单打开的上传 UI
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

test.describe('解析PdMan文件弹层键盘', () => {
  test('解析PdMan：首焦上传区；Esc 归还；Tab trap', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('pdman-kb');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'pdmankb', 'import pdman keyboard');

      const menuTrigger = page.getByRole('button', { name: '项目菜单' });
      await menuTrigger.click();
      await page
        .getByTestId('project-menu-panel')
        .getByRole('menuitem', { name: '导入' })
        .click();
      await page.getByRole('menuitem', { name: '解析PdMan文件' }).click();

      const dialog = page.getByRole('dialog', { name: /解析已有PdMan文件/ });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(
        dialog.getByRole('button', { name: '选择PdMan文件' }),
      ).toBeFocused({ timeout: 5_000 });

      await assertTabTrap(dialog, page);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(menuTrigger).toBeFocused({ timeout: 5_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
