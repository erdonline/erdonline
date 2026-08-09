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
 * 重建基线二次确认 Modal 键盘闭环
 * — 重建版本表单 OK → confirmDestructive「重建基线」：首焦「重建」；Esc 关确认不落盘、归还重建钮；Tab trap
 * — 不踩 version-sync-rebuild-keyboard 表单层 / version.spec 打开即关
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

test.describe('重建基线确认键盘', () => {
  test('重建确认：首焦重建；Esc 归还不落盘；Tab trap', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('vrebld-cfm-kb');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vrc', 'rebuild confirm keyboard');
      await openVersionPage(page);
      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });

      await page.getByTestId('version-toolbar-more-btn').click();
      const trigger = page.getByTestId('version-rebuild-btn');
      await expect(trigger).toBeEnabled({ timeout: 10_000 });
      await trigger.click();

      const formDialog = page.getByRole('dialog', { name: /重建版本/ });
      await expect(formDialog).toBeVisible({ timeout: 10_000 });
      await formDialog.getByRole('textbox', { name: '版本号' }).fill('2.0.0');
      await formDialog.getByRole('textbox', { name: '版本描述' }).fill('rebuild confirm esc');
      await formDialog.getByRole('button', { name: /确\s*定/ }).click();

      const confirm = page.getByRole('dialog', { name: '重建基线' });
      await expect(confirm).toBeVisible({ timeout: 10_000 });
      await expect(confirm.getByRole('button', { name: /重\s*建/ })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(confirm, page);

      await page.keyboard.press('Escape');
      await expect(confirm).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
      // Esc 不落盘：原版本仍在
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
