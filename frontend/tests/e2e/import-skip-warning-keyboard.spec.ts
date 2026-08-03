import { expect, test, type Locator, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import {
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  e2eAccount,
  expectToast,
  login,
  uniqueProjectName,
} from './helpers';

/**
 * 导入跳过校验 Modal.warning 键盘闭环
 * — 首焦「知道了」；Esc / OK 关窗归还「解析并导入」；Tab trap
 * — 触发：同 DBML 二次导入 → 模型名已存在全跳过
 */

async function assertFocusInside(dialog: Locator) {
  expect(await dialog.evaluate((dlg) => dlg.contains(document.activeElement))).toBe(true);
}

async function assertTabTrap(dialog: Locator, page: Page, presses = 8) {
  for (let i = 0; i < presses; i += 1) {
    await page.keyboard.press('Tab');
    await assertFocusInside(dialog);
  }
  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press('Shift+Tab');
    await assertFocusInside(dialog);
  }
}

async function openImportDbml(page: Page) {
  await page.getByRole('button', { name: '项目菜单' }).click();
  await page
    .getByTestId('project-menu-panel')
    .getByRole('menuitem', { name: '导入' })
    .click();
  await page.getByRole('menuitem', { name: '导入DBML' }).click();
  const dialog = page.getByRole('dialog', { name: '导入 DBML' });
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  return dialog;
}

test.describe('导入跳过校验键盘', () => {
  test('全跳过后：首焦知道了；Esc/OK 归还；Tab trap', async ({ page }) => {
    test.setTimeout(120_000);
    const projectName = uniqueProjectName('import-skip-kb');
    const fixture = path.join(__dirname, '../fixtures/minimal.dbml');
    const dbmlText = fs.readFileSync(fixture, 'utf8');

    try {
      await login(page, e2eAccount());
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'iskb', 'import skip keyboard');

      // 首次导入成功
      let dlg = await openImportDbml(page);
      await dlg.locator('input[type="file"]').setInputFiles(fixture);
      await expectToast(page, /DBML 导入成功/);
      await expect(dlg).toBeHidden({ timeout: 10_000 });

      // 再次导入同一文件 → 全跳过警告
      dlg = await openImportDbml(page);
      await dlg.getByLabel('DBML文本').fill(dbmlText);
      const parseBtn = dlg.getByRole('button', { name: '解析并导入' });
      await parseBtn.click();

      const warn = page.getByRole('dialog', { name: '重要提示' });
      await expect(warn).toBeVisible({ timeout: 15_000 });
      await expect(warn.getByText(/已经在本系统中存在，已跳过导入/)).toBeVisible();
      await expect(warn.getByRole('button', { name: '知道了' })).toBeFocused({
        timeout: 5_000,
      });
      await assertTabTrap(warn, page);

      await page.keyboard.press('Escape');
      await expect(warn).toHaveCount(0);
      // 父导入窗仍开；焦点归还触发解析的「解析并导入」
      await expect(dlg).toBeVisible();
      await expect(parseBtn).toBeFocused({ timeout: 5_000 });

      await parseBtn.click();
      const again = page.getByRole('dialog', { name: '重要提示' });
      await expect(again).toBeVisible({ timeout: 15_000 });
      await expect(again.getByRole('button', { name: '知道了' })).toBeFocused({
        timeout: 5_000,
      });
      await again.getByRole('button', { name: '知道了' }).click();
      await expect(again).toHaveCount(0);
      await expect(parseBtn).toBeFocused({ timeout: 5_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
