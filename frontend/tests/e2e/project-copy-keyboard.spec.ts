import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  login,
  openVersionPage,
  saveVersion,
  uniqueProjectName,
} from './helpers';

/**
 * 版本行「复刻」Modal 键盘闭环
 * — 打开首焦项目名；Esc 关；焦点归还触发器；Tab trap 在 dialog
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

test.describe('复刻弹层键盘', () => {
  test('复刻：首焦项目名；Esc 归还；Tab trap', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('pcopy-kb');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'pcopy', 'copy keyboard');
      await openVersionPage(page);
      await saveVersion(page);

      const row = page.getByTestId('version-row-1.0.0');
      await expect(row).toBeVisible({ timeout: 10_000 });
      await row.hover();
      const trigger = row.getByTestId('project-copy-trigger');
      await expect(trigger).toBeVisible();
      await trigger.click();

      const dialog = page.getByRole('dialog', {
        name: '复刻为新项目(从当前版本创建新项目)',
      });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByRole('textbox', { name: '项目名' })).toBeFocused({
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
