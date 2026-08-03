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
 * 版本动作弹窗键盘闭环：新增 / 删除 / 回滚
 * — 打开首焦字段或确认钮；Esc 关；焦点归还触发器；Tab trap 在 dialog
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

test.describe('版本动作弹窗键盘', () => {
  test('新增：首焦版本号；Esc 归还；Tab trap', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('vmodal-add');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vma', 'modal keyboard add');
      await openVersionPage(page);

      const trigger = page.getByTestId('add-version-btn');
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: '新增版本' });
      await expect(dialog).toBeVisible();
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

  test('删除确认：首焦确定；Esc 归还；Tab trap', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('vmodal-del');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vmd', 'modal keyboard del');
      await openVersionPage(page);
      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });

      const row = page.getByTestId('version-row-1.0.0');
      await row.hover();
      const trigger = row.getByRole('button', { name: '删除版本' });
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: '删除版本' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('button', { name: '是' })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(dialog, page, 8);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('回滚确认：首焦确定；Esc 归还；Tab trap', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('vmodal-rev');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'vmr', 'modal keyboard rev');
      await openVersionPage(page);
      await saveVersion(page);
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible({ timeout: 10_000 });

      const row = page.getByTestId('version-row-1.0.0');
      await row.hover();
      const trigger = row.getByRole('button', { name: '回滚版本' });
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: '回滚版本' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('button', { name: '是' })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(dialog, page, 8);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
      await expect(page.getByTestId('version-row-1.0.0')).toBeVisible();
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
