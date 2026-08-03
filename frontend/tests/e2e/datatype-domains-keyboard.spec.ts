import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * 数据类型字典 Modal 键盘闭环
 * — 打开首焦「类型名称」；Esc 关；焦点归还触发器；Tab trap 在 dialog
 * — 定位：`role=button`「新增字段类型」/ `role=dialog`「新增字段类型」（勿扫 `.ant-*`）
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

test.describe('数据类型字典弹层键盘', () => {
  test('新增字段类型：首焦名称；Esc 归还；Tab trap', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('dt-kb');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'dtkb', 'datatype modal keyboard');

      const projectId = new URL(page.url()).searchParams.get('projectId');
      expect(projectId).toBeTruthy();
      await page.goto(
        `/design/table/setting/dataType?projectId=${projectId}`,
      );
      await expect(page).toHaveURL(/\/design\/table\/setting\/dataType/, {
        timeout: 15_000,
      });
      await expect(page.getByTestId('datatype-domains-page')).toBeVisible({
        timeout: 15_000,
      });

      const trigger = page.getByRole('button', { name: '新增字段类型' });
      await expect(trigger).toBeVisible({ timeout: 10_000 });
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: '新增字段类型' });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByRole('textbox', { name: '类型名称' })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(dialog, page);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => undefined);
    }
  });
});
