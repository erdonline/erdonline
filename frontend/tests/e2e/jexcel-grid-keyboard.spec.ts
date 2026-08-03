import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  addFieldInline,
  createAndOpenPersonProject,
  deleteOwnPersonProjects,
  login,
  openRelationFromEmpty,
  rfNode,
  uniqueProjectName,
} from './helpers';

/**
 * 表设计 JExcel 网格 Escape / 快捷操作 Modal.info 键盘闭环
 * — Escape 退出单元格编辑 → 焦点归还 `jexcel-grid`；签页不关
 * — 「快捷操作」Modal.info：首焦「知道了」；Esc 归还触发器；Tab trap
 * — 定位：role / aria / testid（勿扫 `.ant-*`）
 */

async function assertFocusInside(dialog: Locator) {
  expect(
    await dialog.evaluate((dlg) => dlg.contains(document.activeElement)),
  ).toBe(true);
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

async function openFieldJexcel(page: Page) {
  await openRelationFromEmpty(page);
  await page.getByRole('button', { name: '新建第一张表' }).click();
  const node = rfNode(page, 'T_TABLE_1');
  await expect(node).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('save-status')).toHaveText('已保存', { timeout: 15_000 });
  await addFieldInline(page, 'T_TABLE_1', 'NAME');
  await node.getByTestId('canvas-open-field').evaluate((el: HTMLElement) => el.click());
  const fieldEdit = page.getByTestId('table-field-edit');
  await expect(fieldEdit).toBeVisible({ timeout: 10_000 });
  await expect(fieldEdit.getByRole('cell', { name: 'NAME' })).toBeVisible();
  return fieldEdit;
}

test.describe('JExcel 网格 Escape / 快捷操作键盘', () => {
  test('Escape 退出单元格编辑归还网格；快捷操作 Modal 键盘闭环', async ({ page }) => {
    test.setTimeout(90_000);
    const projectName = uniqueProjectName('jxesc-kb');
    try {
      await login(page);
      await deleteOwnPersonProjects(page);
      await createAndOpenPersonProject(page, projectName, 'jxesc', 'jexcel escape keyboard');

      const fieldEdit = await openFieldJexcel(page);
      const grid = fieldEdit.getByTestId('jexcel-grid');
      const toolbar = fieldEdit.getByRole('toolbar', { name: '表格编辑工具栏' });
      await expect(toolbar).toBeVisible();
      await expect(toolbar).toHaveAttribute('data-testid', 'jexcel-toolbar');

      // 双击进编辑 → Escape 丢弃 → 焦点回网格（禁落 #jexcel_textarea）
      await fieldEdit.getByRole('cell', { name: 'NAME' }).dblclick();
      await expect
        .poll(async () =>
          page.evaluate(() => {
            const t = document.querySelector(
              '#jexcel_textarea, textarea.jexcel_textarea, .jexcel_textarea',
            ) as HTMLElement | null;
            return !!(t && (t.offsetParent !== null || document.activeElement === t));
          }),
        )
        .toBe(true);

      await page.keyboard.type('DRAFT');
      await page.keyboard.press('Escape');

      await expect(grid).toBeFocused({ timeout: 5_000 });
      await expect(fieldEdit.getByRole('cell', { name: 'NAME' })).toBeVisible();
      await expect(fieldEdit.getByRole('cell', { name: 'DRAFT' })).toHaveCount(0);
      await expect(page.getByTestId('table-design').getByRole('tab', { name: '字段' })).toHaveAttribute(
        'aria-selected',
        'true',
      );

      // 快捷操作 Modal.info 键盘（工具栏 Tab 序已由 relation「工具栏 Tab」覆盖）
      const help = fieldEdit.getByRole('button', { name: '快捷操作' });
      await expect(help).toHaveAttribute('data-testid', 'jexcel-toolbar-help');
      await help.focus();
      await expect(help).toBeFocused();
      await page.keyboard.press('Enter');

      const dialog = page.getByRole('dialog').filter({ hasText: '快捷操作' });
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByRole('button', { name: '知道了' })).toBeFocused({
        timeout: 5_000,
      });

      await assertTabTrap(dialog, page);

      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(help).toBeFocused({ timeout: 5_000 });
    } finally {
      await deleteOwnPersonProjects(page).catch(() => {});
    }
  });
});
