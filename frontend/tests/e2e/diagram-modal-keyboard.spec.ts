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
 * 画布「新建关系图」Modal 键盘闭环
 * — 打开首焦「关系图名称」；Esc 关；焦点归还触发器；Tab trap 在 dialog
 * — 定位：toolbar `role=button`「新建关系图」/ dialog「新建关系图」（勿扫 `.ant-*`）
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

test.describe('画布关系图弹层键盘', () => {
  test('新建关系图：首焦名称；Esc 归还；Tab trap', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('diagram-kb');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'diagkb', 'diagram modal keyboard');

      await openRelationFromEmpty(page);
      await page.getByTestId('canvas-empty-create').click();
      await expect(rfNode(page, 'T_TABLE_1')).toBeVisible();

      const trigger = page
        .getByRole('button', { name: '新建关系图' })
        .filter({ hasText: '新建图' });
      await expect(trigger).toBeVisible({ timeout: 10_000 });
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: '新建关系图' });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByRole('textbox', { name: '关系图名称' })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(dialog, page);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
