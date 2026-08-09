import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  openVersionPage,
  saveVersion,
  uniqueProjectName,
} from './helpers';

/**
 * 同步配置 / 重建版本 Modal 键盘闭环
 * — 打开首焦首控；Esc 关；焦点归还触发器；Tab trap 在 dialog
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

test.describe('同步配置/重建版本弹层键盘', () => {
  test('同步配置：首焦字段增量；Esc 归还；Tab trap', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('vsync-kb');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vsync', 'sync config keyboard');
      await openVersionPage(page);

      await page.getByTestId('version-toolbar-more-btn').click();
      const trigger = page.getByTestId('version-sync-config-btn');
      await expect(trigger).toBeEnabled();
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: /同步配置/ });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByRole('radio', { name: '字段增量' })).toBeFocused({
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

  test('重建版本：首焦版本号；Esc 归还；Tab trap', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('vrebld-kb');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vrb', 'rebuild keyboard');
      await openVersionPage(page);
      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });

      await page.getByTestId('version-toolbar-more-btn').click();
      const trigger = page.getByTestId('version-rebuild-btn');
      await expect(trigger).toBeEnabled({ timeout: 10_000 });
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: /重建版本/ });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByRole('textbox', { name: '版本号' })).toBeFocused({
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
