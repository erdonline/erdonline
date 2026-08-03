import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  login,
  openRelationFromEmpty,
  uniqueProjectName,
} from './helpers';

/**
 * 导入/导出弹层键盘闭环（DBML）
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

test.describe('导入导出弹层键盘', () => {
  test('导入 DBML（空态 CTA）：首焦文本；Esc 归还；Tab trap', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('io-kb-import');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'iokbi', 'io kb import');
      await openRelationFromEmpty(page);

      const trigger = page.getByTestId('canvas-empty-import-dbml');
      await expect(trigger).toBeVisible({ timeout: 10_000 });
      await trigger.click();

      const dialog = page.getByRole('dialog', { name: '导入 DBML' });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByLabel('DBML文本')).toBeFocused({ timeout: 5_000 });

      await assertTabTrap(dialog, page);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused({ timeout: 5_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });

  test('导出 DBML（项目菜单）：首焦模型；Esc 归还菜单钮；Tab trap', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('io-kb-export');
    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'iokbe', 'io kb export');
      // 默认项目无 modules；先建模型再导出，Select 才可聚焦
      await openRelationFromEmpty(page);

      const menuTrigger = page.getByRole('button', { name: '项目菜单' });
      await menuTrigger.click();
      await page
        .getByTestId('project-menu-panel')
        .getByRole('menuitem', { name: '导出' })
        .click();
      await page.getByRole('menuitem', { name: '导出DBML' }).click();

      const dialog = page.getByRole('dialog', { name: '导出 DBML' });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      const moduleSelect = dialog.getByRole('combobox', { name: '导出模型' });
      await expect(moduleSelect).toBeEnabled({ timeout: 10_000 });
      await expect(moduleSelect).toBeFocused({ timeout: 5_000 });

      await assertTabTrap(dialog, page);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(menuTrigger).toBeFocused({ timeout: 5_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
