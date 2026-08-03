import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * 设计器左树 EntityModal（新增模型）键盘闭环
 * — 空态「新增模型」打开首焦「名称」；Esc 关；焦点归还触发器；Tab trap 在 dialog
 * — 不提交；不踩新增表/关系图分支（同 Modal 组件）
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

test.describe('EntityModal 弹层键盘', () => {
  test('新增模型：首焦名称；Esc 归还；Tab trap', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('entity-kb');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'entkb', 'entity modal keyboard');

      const trigger = page.getByRole('button', { name: '新增模型' });
      await expect(trigger).toBeVisible({ timeout: 15_000 });
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: '新增模型' });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByRole('textbox', { name: '名称' })).toBeFocused({
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
