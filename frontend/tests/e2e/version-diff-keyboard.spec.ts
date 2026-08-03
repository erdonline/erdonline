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
 * 版本对比/详情 diff Modal 键盘闭环
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

test.describe('版本对比弹层键盘', () => {
  test('任意版本比较：首焦初始版本；Esc 归还；Tab trap', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('vdiff-cmp');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vdcmp', 'diff kb compare');
      await openVersionPage(page);
      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });
      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.1')).toBeVisible({ timeout: 10_000 });

      const trigger = page.getByTestId('version-compare-btn');
      await expect(trigger).toBeEnabled();
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: '任意版本比较' });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByRole('combobox', { name: '初始版本' })).toBeFocused({
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

  test('版本变更详情：首焦导出；Esc 归还；Tab trap', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('vdiff-det');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vddet', 'diff kb detail');
      await openVersionPage(page);
      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });

      const row = page.getByTestId('version-row-1.0.0');
      await row.hover();
      const trigger = row.getByTestId('version-detail-btn');
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: '版本变更详情' });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(
        dialog.getByRole('button', { name: '导出变更清单' }),
      ).toBeFocused({ timeout: 5_000 });

      await assertTabTrap(dialog, page);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
